import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const BUILD_ID_PATH = join(process.cwd(), ".next", "BUILD_ID");
const NEXT_BIN_PATH = join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const SERVER_START_TIMEOUT_MS = 60_000;
const REQUEST_TIMEOUT_MS = 20_000;
const DUMMY_POST_ID = "11111111-1111-4111-8111-111111111111";
const SEOUL_CITY_HALL = {
  latitude: 37.5665,
  longitude: 126.978,
};

const METERS_PER_DEGREE_LATITUDE = 111320;
const LOCATION_BUCKET_SIZE_METERS = 100;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getMetersPerDegreeLongitude(latitude) {
  return Math.max(
    METERS_PER_DEGREE_LATITUDE * Math.cos(toRadians(latitude)),
    0.000001,
  );
}

function quantizeLocationTo100MeterGrid(location) {
  const latitudeBucket100m = Math.round(
    (location.latitude * METERS_PER_DEGREE_LATITUDE) / LOCATION_BUCKET_SIZE_METERS,
  );
  const longitudeBucket100m = Math.round(
    (location.longitude * getMetersPerDegreeLongitude(location.latitude)) /
      LOCATION_BUCKET_SIZE_METERS,
  );

  return {
    latitudeBucket100m,
    longitudeBucket100m,
  };
}

function formatServerLogs(output) {
  const lines = output
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "No server logs captured.";
  }

  return lines.slice(-20).join("\n");
}

async function ensureBuildExists() {
  try {
    await access(BUILD_ID_PATH);
  } catch {
    throw new Error(
      "Missing .next/BUILD_ID. Run `npm run build` before `npm run smoke:api`.",
    );
  }
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Unable to allocate a free port.")));
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(address.port);
      });
    });
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.killed || !child.pid) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.on("close", resolve);
      killer.on("error", resolve);
    });
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("close", resolve)),
    delay(5_000).then(() => child.kill("SIGKILL")),
  ]);
}

async function waitForServer(baseUrl, child, logs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SERVER_START_TIMEOUT_MS) {
    if (child.exitCode !== null) {
      throw new Error(
        `next start exited before smoke tests began.\n${formatServerLogs(logs.join(""))}`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/api/feed/global?limit=1`, {
        signal: AbortSignal.timeout(5_000),
      });

      if (response.status >= 200) {
        return;
      }
    } catch {
      // Server is not ready yet.
    }

    await delay(500);
  }

  throw new Error(
    `Timed out waiting for next start.\n${formatServerLogs(logs.join(""))}`,
  );
}

async function startServer() {
  const port = await findFreePort();
  const logs = [];
  const child = spawn(
    process.execPath,
    [NEXT_BIN_PATH, "start", "-p", String(port), "-H", "127.0.0.1"],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => {
    logs.push(String(chunk));
  });
  child.stderr.on("data", (chunk) => {
    logs.push(String(chunk));
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(baseUrl, child, logs);

  return {
    baseUrl,
    child,
    logs,
  };
}

async function request(baseUrl, path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const contentType = response.headers.get("content-type") ?? "";
  let body = null;

  if (response.status !== 204 && contentType.includes("application/json")) {
    body = await response.json();
  } else if (response.status !== 204) {
    body = await response.text();
  }

  return {
    body,
    response,
  };
}

function expectJsonSuccess(body, label) {
  assert.ok(body && typeof body === "object", `${label} should return JSON.`);
  assert.equal(body.success, true, `${label} should return success=true.`);
  assert.equal(body.error, null, `${label} should not include an error payload.`);
  return body.data;
}

function expectJsonFailure(body, label, expectedCode) {
  assert.ok(body && typeof body === "object", `${label} should return JSON.`);
  assert.equal(body.success, false, `${label} should return success=false.`);
  assert.equal(body.data, null, `${label} should return null data on failure.`);
  assert.equal(body.error?.code, expectedCode, `${label} should return ${expectedCode}.`);
  assert.equal(
    typeof body.error?.message,
    "string",
    `${label} should include an error message.`,
  );
}

async function runSmokeTests(baseUrl) {
  const results = [];

  const globalFeed = await request(baseUrl, "/api/feed/global?limit=2");
  assert.equal(globalFeed.response.status, 200, "global feed should return 200.");
  const globalFeedData = expectJsonSuccess(globalFeed.body, "global feed");
  assert.ok(Array.isArray(globalFeedData.items), "global feed items should be an array.");
  assert.ok("nextCursor" in globalFeedData, "global feed should include nextCursor.");
  results.push("GET /api/feed/global -> 200");

  const invalidNearby = await request(baseUrl, "/api/feed/nearby?limit=2");
  assert.equal(invalidNearby.response.status, 400, "invalid nearby feed should return 400.");
  expectJsonFailure(invalidNearby.body, "invalid nearby feed", "INVALID_LOCATION_BUCKETS");
  results.push("GET /api/feed/nearby (invalid buckets) -> 400");

  const quantizedLocation = quantizeLocationTo100MeterGrid(SEOUL_CITY_HALL);
  const validNearby = await request(
    baseUrl,
    `/api/feed/nearby?limit=2&latitudeBucket100m=${quantizedLocation.latitudeBucket100m}&longitudeBucket100m=${quantizedLocation.longitudeBucket100m}`,
  );
  assert.equal(validNearby.response.status, 200, "valid nearby feed should return 200.");
  const validNearbyData = expectJsonSuccess(validNearby.body, "valid nearby feed");
  assert.ok(Array.isArray(validNearbyData.items), "valid nearby feed items should be an array.");
  results.push("GET /api/feed/nearby (valid buckets) -> 200");

  const nearbySync = await request(baseUrl, "/api/feed/nearby/sync", {
    body: JSON.stringify({
      limit: 2,
      loadedPostIds: [],
      location: SEOUL_CITY_HALL,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.ok(
    nearbySync.response.status === 200 || nearbySync.response.status === 204,
    "nearby sync should return 200 or 204.",
  );
  if (nearbySync.response.status === 200) {
    const nearbySyncData = expectJsonSuccess(nearbySync.body, "nearby sync");
    assert.ok(Array.isArray(nearbySyncData.items), "nearby sync items should be an array.");
    assert.equal(
      typeof nearbySyncData.newItemsCount,
      "number",
      "nearby sync should include newItemsCount.",
    );
  }
  results.push(`POST /api/feed/nearby/sync -> ${nearbySync.response.status}`);

  const invalidLocationResolve = await request(baseUrl, "/api/location/resolve", {
    body: JSON.stringify({}),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.equal(
    invalidLocationResolve.response.status,
    400,
    "invalid location resolve should return 400.",
  );
  expectJsonFailure(
    invalidLocationResolve.body,
    "invalid location resolve",
    "INVALID_LOCATION",
  );
  results.push("POST /api/location/resolve (invalid) -> 400");

  const malformedPostCreate = await request(baseUrl, "/api/posts", {
    body: "{",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.equal(malformedPostCreate.response.status, 400, "malformed post create should return 400.");
  expectJsonFailure(malformedPostCreate.body, "malformed post create", "INVALID_REQUEST");
  results.push("POST /api/posts (malformed JSON) -> 400");

  const engagementSnapshot = await request(baseUrl, "/api/posts/engagement", {
    body: JSON.stringify({
      postIds: [DUMMY_POST_ID],
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.equal(engagementSnapshot.response.status, 200, "engagement snapshot should return 200.");
  const engagementSnapshotData = expectJsonSuccess(
    engagementSnapshot.body,
    "engagement snapshot",
  );
  assert.ok(Array.isArray(engagementSnapshotData.items), "engagement snapshot items should be an array.");
  assert.equal(
    typeof engagementSnapshotData.snapshotToken,
    "string",
    "engagement snapshot should include snapshotToken.",
  );
  results.push("POST /api/posts/engagement -> 200");

  const engagementNotModified = await request(baseUrl, "/api/posts/engagement", {
    body: JSON.stringify({
      postIds: [DUMMY_POST_ID],
      snapshotToken: engagementSnapshotData.snapshotToken,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.equal(
    engagementNotModified.response.status,
    204,
    "engagement snapshot with same token should return 204.",
  );
  results.push("POST /api/posts/engagement (same token) -> 204");

  const firstMessage = await request(baseUrl, "/api/candidate/first-message", {
    body: JSON.stringify({ content: "hello" }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.ok(
    firstMessage.response.status === 401 || firstMessage.response.status === 500,
    "candidate first message should return 401 or 500.",
  );
  if (firstMessage.response.status === 401) {
    expectJsonFailure(firstMessage.body, "candidate first message", "UNAUTHORIZED");
  } else {
    expectJsonFailure(firstMessage.body, "candidate first message", "NO_CONFIG");
  }
  results.push(`POST /api/candidate/first-message -> ${firstMessage.response.status}`);

  const malformedAgreeToggle = await request(
    baseUrl,
    `/api/posts/${DUMMY_POST_ID}/agree/toggle`,
    {
      body: "{",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
  assert.equal(
    malformedAgreeToggle.response.status,
    400,
    "malformed agree toggle should return 400.",
  );
  expectJsonFailure(malformedAgreeToggle.body, "malformed agree toggle", "INVALID_REQUEST");
  results.push("POST /api/posts/[postId]/agree/toggle (malformed JSON) -> 400");

  const malformedReport = await request(baseUrl, `/api/posts/${DUMMY_POST_ID}/report`, {
    body: "{",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.equal(malformedReport.response.status, 400, "malformed report should return 400.");
  expectJsonFailure(malformedReport.body, "malformed report", "INVALID_REQUEST");
  results.push("POST /api/posts/[postId]/report (malformed JSON) -> 400");

  return results;
}

async function main() {
  await ensureBuildExists();
  const { baseUrl, child, logs } = await startServer();

  try {
    const results = await runSmokeTests(baseUrl);
    console.log("API smoke tests passed:");
    for (const result of results) {
      console.log(`- ${result}`);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown smoke test failure.";
    throw new Error(`${message}\n${formatServerLogs(logs.join(""))}`);
  } finally {
    await stopServer(child);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

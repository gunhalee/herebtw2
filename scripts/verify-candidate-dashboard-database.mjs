import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

function loadLocalEnv() {
  const filePath = path.join(root, ".env.local");
  if (!fs.existsSync(filePath)) return {};

  const values = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const separator = line.indexOf("=");
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const env = { ...loadLocalEnv(), ...process.env };
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const secret = env.SUPABASE_SECRET_KEY;

if (!baseUrl || !secret) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required in .env.local or the process environment.",
  );
}

const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
};

async function rest(route, init = {}) {
  const response = await fetch(`${baseUrl}/rest/v1/${route}`, {
    ...init,
    headers: { ...headers, ...init.headers },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.text();
  if (!response.ok) {
    const migrationHint = response.status === 404
      ? " The candidate dashboard migration may not be applied yet."
      : "";
    throw new Error(`${route}: ${response.status} ${body}${migrationHint}`);
  }
  return body ? JSON.parse(body) : null;
}

async function main() {
const status = await rest("rpc/get_candidate_dashboard_operational_status", {
  method: "POST",
  body: "{}",
});

const unmappedPosts = status.unmappedPostCount > 0
  ? await rest(
      "posts?select=id,administrative_dong_name,administrative_dong_code,location_scope,location_source,created_at&status=eq.active&author_type=eq.citizen&location_area_code=is.null&order=created_at.desc&limit=20",
    )
  : [];

const candidates = await rest(
  "candidates?select=auth_user_id&is_active=eq.true&auth_user_id=not.is.null",
);
const bootstrapStatuses = {};

for (const candidate of candidates) {
  const bootstrap = await rest("rpc/get_candidate_dashboard_bootstrap_v2", {
    method: "POST",
    body: JSON.stringify({
      p_auth_user_id: candidate.auth_user_id,
      p_filter: "open",
      p_limit: 1,
    }),
  });
  bootstrapStatuses[bootstrap?.status ?? "invalid_response"] =
    (bootstrapStatuses[bootstrap?.status ?? "invalid_response"] ?? 0) + 1;
}

const report = {
  ...status,
  bootstrapStatuses,
  unmappedPosts,
  strict,
};
console.log(JSON.stringify(report, null, 2));

const errors = [];
const warnings = [];

if (
  status.maxConcurrentCandidateSessions !==
  status.activeCandidateCount * 3
) {
  errors.push("candidate session capacity is not active candidate count × 3");
}
if (status.unmappedCandidateCount > 0) {
  errors.push(`${status.unmappedCandidateCount} active candidates have no current coverage`);
}
if (status.unmappedPostCount > 0) {
  errors.push(`${status.unmappedPostCount} eligible posts have no canonical area`);
}
if (status.routingDeadCount > 0) {
  errors.push(`${status.routingDeadCount} routing jobs are dead`);
}
if (status.counterDriftCount > 0) {
  errors.push(`${status.counterDriftCount} candidate counters have drifted`);
}
if (status.notificationDeadCount > 0) {
  errors.push(`${status.notificationDeadCount} reply notifications are dead`);
}
if (status.routingPendingCount > 0) {
  warnings.push(`${status.routingPendingCount} routing jobs remain pending`);
}
if (status.priorityPendingCount > 0) {
  warnings.push(`${status.priorityPendingCount} priority jobs remain pending`);
}
if (status.notificationPendingCount > 0) {
  warnings.push(`${status.notificationPendingCount} notifications remain pending`);
}
if (bootstrapStatuses.candidate_not_found || bootstrapStatuses.invalid_response) {
  errors.push("one or more active candidate bootstrap checks returned an invalid status");
}

for (const warning of warnings) console.warn(`[candidate:verify] warning: ${warning}`);
for (const error of errors) console.error(`[candidate:verify] error: ${error}`);

if (errors.length > 0 || (strict && warnings.length > 0)) {
  process.exitCode = 1;
} else {
  console.log("[candidate:verify] passed");
}
}

try {
  await main();
} catch (error) {
  console.error(
    `[candidate:verify] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}

import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const cwd = process.cwd();
const SRC_COMPONENTS_DIR = fileURLToPath(new URL("../src/components/", import.meta.url));
const SRC_LIB_DIR = fileURLToPath(new URL("../src/lib/", import.meta.url));
const SRC_APP_API_DIR = fileURLToPath(new URL("../src/app/api/", import.meta.url));
const LOCATION_SESSION_FILE = fileURLToPath(
  new URL("../src/lib/geo/browser-location-session.ts", import.meta.url),
);
const LOCATION_TOKEN_FILE = fileURLToPath(
  new URL("../src/lib/geo/location-resolution-token.ts", import.meta.url),
);
const NEARBY_CACHE_FILE = fileURLToPath(
  new URL("../src/lib/posts/browser-nearby-post-cache.ts", import.meta.url),
);
const REVERSE_GEOCODE_PROVIDER_FILE = fileURLToPath(
  new URL("../src/lib/geo/reverse-geocode-provider.ts", import.meta.url),
);
const COMPONENT_EXTENSIONS = new Set([".ts", ".tsx"]);
const LINE_LIMIT = 300;

const RAW_API_FETCH_PATTERN = /fetch\s*\(\s*(?:["'`])\/api\//;
const ROUTE_SECRET_PATTERN =
  /\bSUPABASE_SECRET_KEY\b|\bSUPABASE_SERVICE_ROLE_KEY\b|\bNEXT_PUBLIC_SUPABASE_URL\b/;
const SUPABASE_REST_PATTERN = /rest\/v1\//;

const ALLOWED_OVERSIZED_FILES = new Set([
  "src/components/home/home-static-screen.tsx",
  "src/components/home/use-compose-dong-flashcard.ts",
  "src/components/sheet/post-list-item-card.tsx",
  "src/lib/geo/browser-location-session.ts",
]);

async function* walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }

    yield fullPath;
  }
}

function toRepoPath(filePath) {
  return relative(cwd, filePath).replaceAll("\\", "/");
}

async function collectFiles(directory, allowedExtensions) {
  const files = [];

  for await (const filePath of walk(directory)) {
    if (!allowedExtensions.has(extname(filePath))) {
      continue;
    }

    files.push(filePath);
  }

  return files.sort();
}

async function collectRouteFiles() {
  const routeFiles = [];

  for await (const filePath of walk(SRC_APP_API_DIR)) {
    if (filePath.endsWith("route.ts")) {
      routeFiles.push(filePath);
    }
  }

  return routeFiles.sort();
}

async function main() {
  const violations = [];
  const notes = [];

  const componentFiles = await collectFiles(SRC_COMPONENTS_DIR, COMPONENT_EXTENSIONS);
  for (const filePath of componentFiles) {
    const contents = await readFile(filePath, "utf8");
    if (RAW_API_FETCH_PATTERN.test(contents)) {
      violations.push(`Component raw API fetch is forbidden: ${toRepoPath(filePath)}`);
    }
  }
  notes.push(`[ok] checked ${componentFiles.length} component files for raw /api fetches`);

  const routeFiles = await collectRouteFiles();
  for (const filePath of routeFiles) {
    const contents = await readFile(filePath, "utf8");
    if (ROUTE_SECRET_PATTERN.test(contents)) {
      violations.push(
        `Route should not read Supabase env secrets directly: ${toRepoPath(filePath)}`,
      );
    }

    if (SUPABASE_REST_PATTERN.test(contents)) {
      violations.push(
        `Route should not call Supabase REST paths directly: ${toRepoPath(filePath)}`,
      );
    }
  }
  notes.push(`[ok] checked ${routeFiles.length} route handlers for Supabase access leaks`);

  const locationSessionContents = await readFile(LOCATION_SESSION_FILE, "utf8");
  const locationTokenContents = await readFile(LOCATION_TOKEN_FILE, "utf8");
  const nearbyCacheContents = await readFile(NEARBY_CACHE_FILE, "utf8");
  const reverseGeocodeProviderContents = await readFile(
    REVERSE_GEOCODE_PROVIDER_FILE,
    "utf8",
  );

  if (locationSessionContents.includes("primeBrowserLocationSession")) {
    violations.push("Nearby feed data must not prime the browser location session");
  }

  if (
    !locationTokenContents.includes("quantizeLocationTo20MeterGrid") ||
    !locationTokenContents.includes("quantizeLocationTo100MeterGrid") ||
    !locationTokenContents.includes("LOCATION_RESOLUTION_TOKEN_VERSION = 3")
  ) {
    violations.push("Location token v3 must bind both 20m and 100m cells");
  }

  if (
    locationTokenContents.includes("getSupabaseConfig") ||
    locationTokenContents.includes("SUPABASE_SECRET")
  ) {
    violations.push("Location tokens must use only their dedicated HMAC secret");
  }

  if (
    !/readCachedNearbyPostList\s*\(\s*location:\s*PostLocation/.test(
      nearbyCacheContents,
    )
  ) {
    violations.push("Nearby feed cache reads must require current coordinates");
  }

  if (
    /nominatim|openstreetmap/i.test(reverseGeocodeProviderContents) ||
    !reverseGeocodeProviderContents.includes("dapi.kakao.com")
  ) {
    violations.push("Kakao must be the only reverse geocoding provider");
  }
  notes.push("[ok] checked location grid, token, cache, and provider invariants");

  const sizeCheckFiles = [
    ...(await collectFiles(SRC_COMPONENTS_DIR, COMPONENT_EXTENSIONS)),
    ...(await collectFiles(SRC_LIB_DIR, COMPONENT_EXTENSIONS)),
  ];
  const oversizedAllowlistHits = [];

  for (const filePath of sizeCheckFiles) {
    const repoPath = toRepoPath(filePath);
    const lineCount = (await readFile(filePath, "utf8")).split(/\r?\n/).length;

    if (lineCount <= LINE_LIMIT) {
      continue;
    }

    if (ALLOWED_OVERSIZED_FILES.has(repoPath)) {
      oversizedAllowlistHits.push(`${repoPath} (${lineCount} lines)`);
      continue;
    }

    violations.push(
      `Large file exceeds ${LINE_LIMIT} lines without allowlist entry: ${repoPath} (${lineCount} lines)`,
    );
  }
  notes.push(
    `[ok] checked ${sizeCheckFiles.length} component/lib files for new large-file regressions`,
  );

  for (const note of notes) {
    console.log(note);
  }

  if (oversizedAllowlistHits.length > 0) {
    console.log("[note] existing oversized files still on the allowlist:");
    for (const entry of oversizedAllowlistHits) {
      console.log(`- ${entry}`);
    }
  }

  if (violations.length > 0) {
    console.error("[fail] architecture guard violations:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("[pass] architecture guard passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const cwd = process.cwd();
const SRC_COMPONENTS_DIR = fileURLToPath(new URL("../src/components/", import.meta.url));
const SRC_LIB_DIR = fileURLToPath(new URL("../src/lib/", import.meta.url));
const SRC_APP_API_DIR = fileURLToPath(new URL("../src/app/api/", import.meta.url));
const COMPONENT_EXTENSIONS = new Set([".ts", ".tsx"]);
const LINE_LIMIT = 300;

const RAW_API_FETCH_PATTERN = /fetch\s*\(\s*(?:["'`])\/api\//;
const ROUTE_SECRET_PATTERN = /\bSUPABASE_SERVICE_ROLE_KEY\b|\bNEXT_PUBLIC_SUPABASE_URL\b/;
const SUPABASE_REST_PATTERN = /rest\/v1\//;

const ALLOWED_OVERSIZED_FILES = new Set([
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

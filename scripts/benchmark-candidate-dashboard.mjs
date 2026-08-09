import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roundsArgument = process.argv.find((value) => value.startsWith("--rounds="));
const rounds = Math.max(1, Math.min(Number(roundsArgument?.split("=")[1] ?? 5), 20));

function readEnv() {
  const result = {};
  for (const rawLine of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const separator = line.indexOf("=");
    result[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return { ...result, ...process.env };
}

const env = readEnv();
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const secret = env.SUPABASE_SECRET_KEY;
if (!baseUrl || !secret) throw new Error("Supabase server configuration is missing.");

const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
};

async function request(route, init = {}) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}/rest/v1/${route}`, {
    ...init,
    headers: { ...headers, ...init.headers },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${route}: ${response.status} ${body}`);
  return {
    data: body ? JSON.parse(body) : null,
    durationMs: Number((performance.now() - startedAt).toFixed(1)),
  };
}

function percentile(values, ratio) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

function summarize(values) {
  return {
    count: values.length,
    minMs: Math.min(...values),
    p50Ms: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
    maxMs: Math.max(...values),
  };
}

const { data: candidates } = await request(
  "candidates?select=id,auth_user_id,district&is_active=eq.true&auth_user_id=not.is.null",
);
if (!candidates.length) throw new Error("No active candidates with auth users were found.");

const concurrentSessions = candidates.length * 3;
if (concurrentSessions > 300 && !process.argv.includes("--allow-large-run")) {
  throw new Error(
    `Refusing ${concurrentSessions} concurrent production reads. Re-run with --allow-large-run after reviewing the load target.`,
  );
}

const v2Durations = [];
const legacyListDurations = [];
const legacyStatsDurations = [];
const invalidResponses = [];

for (let round = 0; round < rounds; round += 1) {
  const sessionCandidates = Array.from(
    { length: concurrentSessions },
    (_, index) => candidates[index % candidates.length],
  );
  const responses = await Promise.all(
    sessionCandidates.map(async (candidate) => {
      const [v2, legacyList, legacyStats] = await Promise.all([
        request("rpc/get_candidate_dashboard_bootstrap_v2", {
          method: "POST",
          body: JSON.stringify({
            p_auth_user_id: candidate.auth_user_id,
            p_filter: "open",
            p_limit: 20,
          }),
        }),
        request("rpc/list_district_posts", {
          method: "POST",
          body: JSON.stringify({
            target_district: candidate.district,
            viewer_candidate_id: candidate.id,
            result_limit: 20,
          }),
        }),
        request("rpc/get_candidate_dashboard_stats", {
          method: "POST",
          body: JSON.stringify({ target_district: candidate.district }),
        }),
      ]);
      return { v2, legacyList, legacyStats };
    }),
  );

  for (const response of responses) {
    v2Durations.push(response.v2.durationMs);
    legacyListDurations.push(response.legacyList.durationMs);
    legacyStatsDurations.push(response.legacyStats.durationMs);
    if (response.v2.data?.status !== "ok") {
      invalidResponses.push(response.v2.data?.status ?? "invalid_response");
    }
  }
}

console.log(JSON.stringify({
  activeCandidateCount: candidates.length,
  concurrentSessions,
  formula: "active candidates × 3",
  rounds,
  totalV2Requests: v2Durations.length,
  v2Bootstrap: summarize(v2Durations),
  legacyDistrictList: summarize(legacyListDurations),
  legacyStats: summarize(legacyStatsDurations),
  invalidResponses,
}, null, 2));

if (invalidResponses.length > 0) process.exitCode = 1;

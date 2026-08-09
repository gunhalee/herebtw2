import { randomUUID } from "node:crypto";

export function createCandidateRequestTiming(scope: string) {
  const requestId = randomUUID();
  const startedAt = performance.now();
  let previousAt = startedAt;
  const phases: Array<{ name: string; durationMs: number }> = [];

  return {
    requestId,
    mark(name: string) {
      const now = performance.now();
      phases.push({ name, durationMs: Number((now - previousAt).toFixed(1)) });
      previousAt = now;
    },
    finish(status: string) {
      const totalMs = Number((performance.now() - startedAt).toFixed(1));
      console.info(JSON.stringify({
        event: "candidate_request_timing",
        scope,
        requestId,
        status,
        totalMs,
        phases,
      }));
      return {
        requestId,
        serverTiming: [
          ...phases.map((phase) => `${phase.name};dur=${phase.durationMs}`),
          `total;dur=${totalMs}`,
        ].join(", "),
      };
    },
  };
}

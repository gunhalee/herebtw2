import { timingSafeEqual } from "node:crypto";
import { fail, ok } from "../../../../../lib/api/response";
import { runModerationWorker } from "../../../../../lib/moderation/worker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  const actual = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expected || expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return fail({ code: "UNAUTHORIZED", message: "Unauthorized." }, 401);
  }
  try {
    return ok(await runModerationWorker());
  } catch (error) {
    console.error("[moderation-worker] run failed", error);
    return fail({ code: "WORKER_FAILED", message: "Moderation worker failed." }, 500);
  }
}

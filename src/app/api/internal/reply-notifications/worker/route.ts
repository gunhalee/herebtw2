import { timingSafeEqual } from "node:crypto";
import { fail, ok } from "../../../../../lib/api/response";
import { runReplyNotificationWorker } from "../../../../../lib/candidate-notifications/worker";
import { isReplyNotificationAsyncEnabled } from "../../../../../lib/candidate-dashboard/feature-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const expected = process.env.CANDIDATE_WORKER_CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  const actual = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expected || expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return fail({ code: "UNAUTHORIZED", message: "Unauthorized." }, 401);
  }
  if (!isReplyNotificationAsyncEnabled()) {
    return fail(
      { code: "WORKER_DISABLED", message: "Reply notification worker is disabled." },
      404,
    );
  }
  try {
    return ok(await runReplyNotificationWorker());
  } catch (error) {
    console.error("[candidate-notification-worker] run failed", error);
    return fail(
      { code: "WORKER_FAILED", message: "Reply notification worker failed." },
      500,
    );
  }
}

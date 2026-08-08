import { fail } from "../api/response";
import { logAbuseEvent } from "./log-event";
import type { AbuseAction } from "./policy";
import { consumeAbuseBudgets, hashAbuseSubject } from "./rate-limit";

export async function getAccountRateLimitResponse(input: {
  accountId: string;
  action: AbuseAction;
  budgets: readonly { limit: number; windowSeconds: number }[];
}) {
  try {
    const subjectHash = hashAbuseSubject(input.accountId);
    const budget = await consumeAbuseBudgets({
      action: input.action,
      budgets: input.budgets,
      subjectHash,
      subjectKind: "account",
    });

    if (budget.allowed) {
      return null;
    }

    await logAbuseEvent(
      "rate_limit_exceeded",
      { retryAfterSeconds: budget.retryAfterSeconds },
      {
        action: input.action,
        decision: "block",
        reasonCode: "account_budget",
        subjectHash,
      },
    );
    const response = fail(
      {
        code: "RATE_LIMITED",
        message: `짧은 시간에 여러 번 요청했어요. ${budget.retryAfterSeconds}초 후 다시 시도해 주세요.`,
      },
      429,
    );
    response.headers.set("Retry-After", String(budget.retryAfterSeconds));
    return response;
  } catch (error) {
    console.error("[abuse] Account budget check failed:", input.action, error);
    return fail(
      { code: "PROTECTION_UNAVAILABLE", message: "잠시 후 다시 시도해 주세요." },
      503,
    );
  }
}

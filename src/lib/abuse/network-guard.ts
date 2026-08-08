import { fail } from "../api/response";
import { logAbuseEvent } from "./log-event";
import type { AbuseAction } from "./policy";
import {
  consumeAbuseBudgets,
  getTrustedNetworkSubject,
} from "./rate-limit";

export async function getNetworkRateLimitResponse(input: {
  action: AbuseAction;
  budgets: readonly { limit: number; windowSeconds: number }[];
  request: Request;
}) {
  const subjectHash = getTrustedNetworkSubject(input.request);

  if (!subjectHash) {
    return null;
  }

  try {
    const budget = await consumeAbuseBudgets({
      action: input.action,
      budgets: input.budgets,
      subjectHash,
      subjectKind: "network",
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
        reasonCode: "network_budget",
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
    // 위치·카드 읽기 계열은 보호 DB 장애 시에도 서비스 자체는 계속 제공한다.
    console.error("[abuse] Network budget check failed open:", input.action, error);
    return null;
  }
}

export async function observeNetworkBudget(input: {
  action: AbuseAction;
  budgets: readonly { limit: number; windowSeconds: number }[];
  deviceId?: string;
  request: Request;
}) {
  const subjectHash = getTrustedNetworkSubject(input.request);

  if (!subjectHash) {
    return;
  }

  try {
    const budget = await consumeAbuseBudgets({
      action: input.action,
      budgets: input.budgets,
      subjectHash,
      subjectKind: "network",
    });

    if (!budget.allowed) {
      await logAbuseEvent(
        "network_rate_shadow",
        { retryAfterSeconds: budget.retryAfterSeconds },
        {
          action: input.action,
          decision: "shadow",
          deviceId: input.deviceId,
          reasonCode: "network_budget",
          subjectHash,
        },
      );
    }
  } catch (error) {
    console.error("[abuse] Network budget observation failed:", input.action, error);
  }
}

import { readJsonBody } from "../../../../../../lib/api/request";
import { fail, ok } from "../../../../../../lib/api/response";
import {
  attachAnonymousActorToken,
  resolveAnonymousActor,
} from "../../../../../../lib/abuse/anonymous-actor";
import { logAbuseEvent } from "../../../../../../lib/abuse/log-event";
import { getBotRejectionResponse } from "../../../../../../lib/abuse/bot-verification";
import { observeNetworkBudget } from "../../../../../../lib/abuse/network-guard";
import { ABUSE_POLICY } from "../../../../../../lib/abuse/policy";
import {
  consumeAbuseBudgets,
  hashAbuseSubject,
} from "../../../../../../lib/abuse/rate-limit";
import { toggleAgreeState } from "../../../../../../lib/posts/mutations";

type ToggleAgreeRequest = { anonymousDeviceId?: string };
type Context = { params: Promise<{ postId: string }> };

export async function POST(request: Request, context: Context) {
  const { postId } = await context.params;
  const bodyResult = await readJsonBody<ToggleAgreeRequest>(request, {
    maxBytes: 2 * 1024,
  });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const botRejection = await getBotRejectionResponse("post.agree.toggle");

  if (botRejection) {
    return botRejection;
  }

  try {
    const actor = await resolveAnonymousActor(
      request,
      bodyResult.body.anonymousDeviceId,
    );

    if (!actor) {
      return fail(
        { code: "INVALID_DEVICE_ID", message: "기기 정보를 확인할 수 없습니다." },
        400,
      );
    }

    const subjectHash = hashAbuseSubject(actor.deviceId);
    const budget = await consumeAbuseBudgets({
      action: "post.agree.toggle",
      budgets: ABUSE_POLICY.agreeToggle.deviceBudgets,
      subjectHash,
      subjectKind: "device",
    });

    if (!budget.allowed) {
      await logAbuseEvent(
        "rate_limit_exceeded",
        { retryAfterSeconds: budget.retryAfterSeconds },
        {
          action: "post.agree.toggle",
          decision: "block",
          deviceId: actor.deviceId,
          reasonCode: "device_budget",
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
      return attachAnonymousActorToken(response, actor, request);
    }

    await observeNetworkBudget({
      action: "post.agree.toggle",
      budgets: ABUSE_POLICY.agreeToggle.networkBudgets,
      deviceId: actor.deviceId,
      request,
    });

    const result = await toggleAgreeState(postId, actor.deviceId);

    return attachAnonymousActorToken(
      ok({
        postId,
        agreed: result.myAgree,
        agreeCount: result.agreeCount,
      }),
      actor,
      request,
    );
  } catch (error) {
    console.error("[agree] Failed to process protected request:", error);
    return fail(
      { code: "PROTECTION_UNAVAILABLE", message: "잠시 후 다시 시도해 주세요." },
      503,
    );
  }
}

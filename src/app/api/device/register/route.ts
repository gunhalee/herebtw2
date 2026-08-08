import { readJsonBody } from "../../../../lib/api/request";
import { fail, ok } from "../../../../lib/api/response";
import {
  attachAnonymousActorToken,
  resolveAnonymousActor,
} from "../../../../lib/abuse/anonymous-actor";
import { logAbuseEvent } from "../../../../lib/abuse/log-event";
import { ABUSE_POLICY } from "../../../../lib/abuse/policy";
import {
  consumeAbuseBudgets,
  getTrustedNetworkSubject,
} from "../../../../lib/abuse/rate-limit";

type RegisterDeviceRequest = {
  anonymousDeviceId?: string;
};

export async function POST(request: Request) {
  const bodyResult = await readJsonBody<RegisterDeviceRequest>(request, {
    maxBytes: 2 * 1024,
  });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  let actor;

  try {
    actor = await resolveAnonymousActor(
      request,
      bodyResult.body.anonymousDeviceId,
      { allowCreateWithoutLegacy: true },
    );

    if (!actor) {
      return fail(
        { code: "DEVICE_REGISTRATION_FAILED", message: "기기를 등록하지 못했습니다." },
        500,
      );
    }

    const networkSubjectHash = getTrustedNetworkSubject(request);

    if (networkSubjectHash) {
      const budget = await consumeAbuseBudgets({
        action: "device.register",
        budgets: ABUSE_POLICY.deviceRegister.networkBudgets,
        subjectHash: networkSubjectHash,
        subjectKind: "network",
      });

      if (!budget.allowed) {
        await logAbuseEvent(
          "rate_limit_exceeded",
          { retryAfterSeconds: budget.retryAfterSeconds },
          {
            action: "device.register",
            decision: "block",
            deviceId: actor.deviceId,
            reasonCode: "network_budget",
            subjectHash: networkSubjectHash,
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
    }

    return attachAnonymousActorToken(
      ok({
        device: {
          anonymousDeviceId: actor.anonymousDeviceId,
          identityMode: actor.source === "legacy" ? "migrated" : actor.source,
        },
      }),
      actor,
      request,
    );
  } catch (error) {
    console.error("[device] Failed to register anonymous device:", error);
    return fail(
      {
        code: "PROTECTION_UNAVAILABLE",
        message: "기기 보호 기능을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      503,
    );
  }
}

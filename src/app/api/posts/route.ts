import { randomUUID } from "node:crypto";
import { readJsonBody } from "../../../lib/api/request";
import { fail, ok } from "../../../lib/api/response";
import {
  attachAnonymousActorToken,
  resolveAnonymousActor,
} from "../../../lib/abuse/anonymous-actor";
import { logAbuseEvent } from "../../../lib/abuse/log-event";
import { getBotRejectionResponse } from "../../../lib/abuse/bot-verification";
import { ABUSE_POLICY } from "../../../lib/abuse/policy";
import {
  consumeAbuseBudgets,
  getTrustedNetworkSubject,
  hashAbuseSubject,
} from "../../../lib/abuse/rate-limit";
import { normalizeNotificationEmail } from "../../../lib/email/validation";
import { SITE_URL } from "../../../lib/content/share-metadata";
import { formatAdministrativeAreaName } from "../../../lib/geo/format-administrative-area";
import {
  verifyLocationResolutionToken,
  type LocationSource,
} from "../../../lib/geo/location-resolution-token";
import {
  isValidCoordinateInput,
  resolveLocationFromCoordinates,
} from "../../../lib/geo/resolve-location";
import { createPost, findIdempotentPost } from "../../../lib/posts/mutations";

type CreatePostRequest = {
  anonymousDeviceId?: string;
  clientRequestId?: string;
  content?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  locationResolutionToken?: string | null;
  locationSource?: LocationSource;
  notificationEmail?: string;
};

function isUuid(value: string | null | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
        value,
      ),
  );
}

async function resolveAdministrativeLocationForPost(input: {
  location: { latitude: number; longitude: number };
  locationResolutionToken?: string | null;
  locationSource?: LocationSource;
  actorBindingHash: string;
}) {
  const verifiedLocation = verifyLocationResolutionToken(
    input.locationResolutionToken,
    input.location,
    input.actorBindingHash,
  );

  if (verifiedLocation) {
    if (
      input.locationSource === "manual" &&
      verifiedLocation.locationSource !== "manual"
    ) {
      throw new Error("INVALID_MANUAL_LOCATION_SELECTION");
    }

    return verifiedLocation;
  }

  if (input.locationSource === "manual") {
    throw new Error("INVALID_MANUAL_LOCATION_SELECTION");
  }

  const resolvedLocation = await resolveLocationFromCoordinates(input.location);

  return {
    administrativeDongCode: resolvedLocation.administrativeDongCode,
    formattedAdministrativeAreaName: formatAdministrativeAreaName({
      sidoName: resolvedLocation.sidoName,
      sigunguName: resolvedLocation.sigunguName,
      administrativeDongName: resolvedLocation.administrativeDongName,
    }),
    locationScope: "dong" as const,
    locationSource: "browser" as const,
  };
}

export async function POST(request: Request) {
  const bodyResult = await readJsonBody<CreatePostRequest>(request, {
    maxBytes: 8 * 1024,
  });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const body = bodyResult.body;

  if (!isValidCoordinateInput(body.location)) {
    return fail(
      { code: "INVALID_LOCATION", message: "유효한 위치 좌표가 필요해요." },
      400,
    );
  }

  if (
    body.locationSource === "manual" &&
    !verifyLocationResolutionToken(
      body.locationResolutionToken,
      body.location,
      undefined,
      { allowBoundTokenWithoutActor: true },
    )
  ) {
    return fail(
      {
        code: "INVALID_LOCATION_SELECTION",
        message: "선택한 지역이 만료되었습니다. 지역을 다시 선택해 주세요.",
      },
      400,
    );
  }

  const botRejection = await getBotRejectionResponse("post.create");

  if (botRejection) {
    return botRejection;
  }

  const requestedClientRequestId =
    request.headers.get("idempotency-key")?.trim() ??
    body.clientRequestId?.trim();
  const clientRequestId = isUuid(requestedClientRequestId)
    ? requestedClientRequestId!
    : requestedClientRequestId
      ? null
      : randomUUID();

  if (!clientRequestId) {
    return fail(
      {
        code: "INVALID_CLIENT_REQUEST_ID",
        message: "요청 식별자가 올바르지 않습니다. 다시 시도해 주세요.",
      },
      400,
    );
  }

  let actor;

  try {
    actor = await resolveAnonymousActor(request, body.anonymousDeviceId);
  } catch (error) {
    console.error("[abuse] Failed to resolve anonymous actor:", error);
    return fail(
      {
        code: "PROTECTION_UNAVAILABLE",
        message: "보호 기능을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      503,
    );
  }

  if (!actor) {
    return fail(
      {
        code: "INVALID_DEVICE_ID",
        message: "기기 정보를 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요.",
      },
      400,
    );
  }

  const withActor = <T extends ReturnType<typeof ok> | ReturnType<typeof fail>>(
    response: T,
  ) => attachAnonymousActorToken(response, actor, request);

  try {
    const existingPost = await findIdempotentPost(
      actor.deviceId,
      clientRequestId,
    );

    if (existingPost) {
      return withActor(
        ok({
          post: existingPost.post,
          publicationStatus: existingPost.publicationStatus,
          notificationVerificationRequired:
            existingPost.publicationStatus === "published" && Boolean(body.notificationEmail?.trim()),
          replayed: true,
        }),
      );
    }

    const deviceSubjectHash = hashAbuseSubject(actor.deviceId);
    const deviceBudget = await consumeAbuseBudgets({
      action: "post.create",
      budgets: ABUSE_POLICY.postCreate.deviceBudgets,
      subjectHash: deviceSubjectHash,
      subjectKind: "device",
    });

    if (!deviceBudget.allowed) {
      await logAbuseEvent(
        "rate_limit_exceeded",
        { retryAfterSeconds: deviceBudget.retryAfterSeconds },
        {
          action: "post.create",
          decision: "block",
          deviceId: actor.deviceId,
          reasonCode: "device_budget",
          subjectHash: deviceSubjectHash,
        },
      );
      const response = fail(
        {
          code: "RATE_LIMITED",
          message: `짧은 시간에 여러 번 요청했어요. ${deviceBudget.retryAfterSeconds}초 후 다시 시도해 주세요.`,
        },
        429,
      );
      response.headers.set("Retry-After", String(deviceBudget.retryAfterSeconds));
      return withActor(response);
    }

    const networkSubjectHash = getTrustedNetworkSubject(request);

    if (networkSubjectHash) {
      const networkBudget = await consumeAbuseBudgets({
        action: "post.create",
        budgets: ABUSE_POLICY.postCreate.networkBudgets,
        subjectHash: networkSubjectHash,
        subjectKind: "network",
      });

      if (!networkBudget.allowed) {
        await logAbuseEvent(
          "network_rate_shadow",
          { retryAfterSeconds: networkBudget.retryAfterSeconds },
          {
            action: "post.create",
            decision: "shadow",
            deviceId: actor.deviceId,
            reasonCode: "network_budget",
            subjectHash: networkSubjectHash,
          },
        );
      }
    }
  } catch (error) {
    console.error("[abuse] Failed to consume post budget:", error);
    return withActor(
      fail(
        {
          code: "PROTECTION_UNAVAILABLE",
          message: "보호 기능을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        },
        503,
      ),
    );
  }

  const normalizedEmail = normalizeNotificationEmail(body.notificationEmail);

  if (!normalizedEmail.ok) {
    return withActor(
      fail({ code: "INVALID_NOTIFICATION_EMAIL", message: normalizedEmail.message }, 422),
    );
  }

  let resolvedAdministrativeLocation;

  try {
    resolvedAdministrativeLocation = await resolveAdministrativeLocationForPost({
      location: body.location,
      locationResolutionToken: body.locationResolutionToken,
      locationSource: body.locationSource,
      actorBindingHash: hashAbuseSubject(actor.deviceId),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_MANUAL_LOCATION_SELECTION"
    ) {
      return withActor(
        fail(
          {
            code: "INVALID_LOCATION_SELECTION",
            message: "선택한 지역이 만료되었습니다. 지역을 다시 선택해 주세요.",
          },
          400,
        ),
      );
    }

    return withActor(
      fail(
        {
          code: "LOCATION_RESOLUTION_FAILED",
          message: "현재 위치를 확인하지 못했어요.",
        },
        502,
      ),
    );
  }

  try {
    const result = await createPost({
      authorDeviceId: actor.deviceId,
      applicationOrigin:
        process.env.NODE_ENV === "production"
          ? SITE_URL
          : new URL(request.url).origin,
      clientRequestId,
      content: body.content ?? "",
      location: body.location,
      resolvedDongCode: resolvedAdministrativeLocation.administrativeDongCode,
      resolvedDongName:
        resolvedAdministrativeLocation.formattedAdministrativeAreaName,
      locationScope: resolvedAdministrativeLocation.locationScope,
      locationSource: resolvedAdministrativeLocation.locationSource,
      notificationEmail: normalizedEmail.value,
    });

    if (!result.ok) {
      return withActor(
        fail(
          { code: result.code, message: result.message },
          result.code === "DUPLICATE_CONTENT" ? 409 : 422,
        ),
      );
    }

    return withActor(
      ok({
        post: result.post,
        publicationStatus: result.publicationStatus,
        notificationVerificationRequired:
          result.publicationStatus === "published" && Boolean(normalizedEmail.value),
      }),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("uq_posts_device_visible_fingerprint") ||
        error.message.includes("uq_posts_device_moderation_content_hmac") ||
        error.message.includes("uq_posts_device_active_content"))
    ) {
      return withActor(
        fail(
          { code: "DUPLICATE_CONTENT", message: "같은 내용의 글을 이미 남겼어요." },
          409,
        ),
      );
    }

    console.error("[posts] Failed to create post:", error);
    return withActor(
      fail(
        { code: "POST_CREATE_FAILED", message: "글을 저장하지 못했습니다." },
        500,
      ),
    );
  }
}

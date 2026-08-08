import type { NextResponse } from "next/server";
import {
  ANONYMOUS_DEVICE_COOKIE_NAME,
  ANONYMOUS_DEVICE_HEADER_NAME,
  ANONYMOUS_DEVICE_TOKEN_MAX_AGE_SECONDS,
  createAnonymousDeviceToken,
  generateServerAnonymousDeviceId,
  readAnonymousDeviceToken,
  verifyAnonymousDeviceToken,
} from "./anonymous-device-token";
import {
  ensureDeviceIdentity,
  findDeviceIdentityById,
} from "../posts/repository/shared";

const LEGACY_DEVICE_ID_PATTERN = /^[a-z0-9._:-]{8,128}$/iu;

export type AnonymousActor = {
  anonymousDeviceId: string;
  deviceId: string;
  issueToken: string | null;
  riskLevel: "normal" | "watch" | "restricted";
  source: "cookie" | "header" | "legacy" | "new";
  tokenVersion: number;
};

function isValidLegacyDeviceId(value: string | null | undefined) {
  return Boolean(value && LEGACY_DEVICE_ID_PATTERN.test(value));
}

export async function resolveAnonymousActor(
  request: Request,
  legacyAnonymousDeviceId?: string | null,
  options?: { allowCreateWithoutLegacy?: boolean },
): Promise<AnonymousActor | null> {
  const rawToken = readAnonymousDeviceToken(request);
  const tokenPayload = verifyAnonymousDeviceToken(rawToken);

  if (tokenPayload) {
    const device = await findDeviceIdentityById(tokenPayload.deviceId);

    if (
      device &&
      !device.revoked_at &&
      (device.token_version ?? 1) === tokenPayload.tokenVersion
    ) {
      return {
        anonymousDeviceId: device.anonymous_device_id,
        deviceId: device.id,
        issueToken: null,
        riskLevel: device.risk_level ?? "normal",
        source: request.headers.has(ANONYMOUS_DEVICE_HEADER_NAME)
          ? "header"
          : "cookie",
        tokenVersion: device.token_version ?? 1,
      };
    }
  }

  const normalizedLegacyId = legacyAnonymousDeviceId?.trim() ?? "";

  if (
    !isValidLegacyDeviceId(normalizedLegacyId) &&
    !options?.allowCreateWithoutLegacy
  ) {
    return null;
  }

  const anonymousDeviceId = isValidLegacyDeviceId(normalizedLegacyId)
    ? normalizedLegacyId
    : generateServerAnonymousDeviceId();
  const device = await ensureDeviceIdentity(anonymousDeviceId);

  if (!device || device.revoked_at) {
    return null;
  }

  const tokenVersion = device.token_version ?? 1;

  return {
    anonymousDeviceId: device.anonymous_device_id,
    deviceId: device.id,
    issueToken: createAnonymousDeviceToken({
      deviceId: device.id,
      tokenVersion,
    }),
    riskLevel: device.risk_level ?? "normal",
    source: isValidLegacyDeviceId(normalizedLegacyId) ? "legacy" : "new",
    tokenVersion,
  };
}

export function attachAnonymousActorToken(
  response: NextResponse,
  actor: AnonymousActor,
  request?: Request,
) {
  if (!actor.issueToken) {
    return response;
  }

  response.cookies.set({
    name: ANONYMOUS_DEVICE_COOKIE_NAME,
    value: actor.issueToken,
    httpOnly: true,
    maxAge: ANONYMOUS_DEVICE_TOKEN_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  if (request?.headers.get("x-herebtw-device-token-mode") === "header") {
    response.headers.set(ANONYMOUS_DEVICE_HEADER_NAME, actor.issueToken);
    response.headers.set("Access-Control-Expose-Headers", ANONYMOUS_DEVICE_HEADER_NAME);
  }

  return response;
}

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const ANONYMOUS_DEVICE_COOKIE_NAME = "herebtw.device";
export const ANONYMOUS_DEVICE_HEADER_NAME = "x-herebtw-device-token";
export const ANONYMOUS_DEVICE_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

type AnonymousDeviceTokenPayload = {
  deviceId: string;
  expiresAt: number;
  issuedAt: number;
  tokenVersion: number;
  version: 1;
};

function getTokenSecret() {
  const secret = process.env.ABUSE_DEVICE_TOKEN_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("ABUSE_DEVICE_TOKEN_SECRET must contain at least 32 characters.");
  }

  return secret;
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      value,
    )
  );
}

export function createAnonymousDeviceToken(input: {
  deviceId: string;
  tokenVersion: number;
  now?: Date;
}) {
  const issuedAt = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const payload: AnonymousDeviceTokenPayload = {
    version: 1,
    deviceId: input.deviceId,
    issuedAt,
    expiresAt: issuedAt + ANONYMOUS_DEVICE_TOKEN_MAX_AGE_SECONDS,
    tokenVersion: input.tokenVersion,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAnonymousDeviceToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, providedSignature, extra] = token.split(".");

  if (!encodedPayload || !providedSignature || extra) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(providedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<AnonymousDeviceTokenPayload>;
    const now = Math.floor(Date.now() / 1000);

    if (
      payload.version !== 1 ||
      !isUuid(payload.deviceId) ||
      !Number.isInteger(payload.issuedAt) ||
      !Number.isInteger(payload.expiresAt) ||
      !Number.isInteger(payload.tokenVersion) ||
      Number(payload.tokenVersion) < 1 ||
      Number(payload.issuedAt) > now + 60 ||
      Number(payload.expiresAt) <= now
    ) {
      return null;
    }

    return payload as AnonymousDeviceTokenPayload;
  } catch {
    return null;
  }
}

export function generateServerAnonymousDeviceId() {
  return `srv_${randomUUID()}`;
}

export function readAnonymousDeviceToken(request: Request) {
  const headerToken = request.headers.get(ANONYMOUS_DEVICE_HEADER_NAME);

  if (headerToken) {
    return headerToken;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANONYMOUS_DEVICE_COOKIE_NAME}=`));

  return cookie
    ? decodeURIComponent(cookie.slice(ANONYMOUS_DEVICE_COOKIE_NAME.length + 1))
    : null;
}

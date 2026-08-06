import { createHmac, timingSafeEqual } from "node:crypto";
import type { PostLocation } from "../../types/post";
import {
  quantizeLocationTo20MeterGrid,
  quantizeLocationTo100MeterGrid,
} from "./location-buckets";
import { LOCATION_POLICY } from "./location-policy";

export const LOCATION_RESOLUTION_TOKEN_TTL_MS =
  LOCATION_POLICY.resolutionTokenTtlMs;
const LOCATION_RESOLUTION_TOKEN_VERSION = 2;

type LocationResolutionTokenPayload = {
  version: typeof LOCATION_RESOLUTION_TOKEN_VERSION;
  administrativeDongCode: string;
  formattedAdministrativeAreaName: string;
  expiresAt: number;
  latitudeBucket20m: number;
  longitudeBucket20m: number;
  latitudeBucket100m: number;
  longitudeBucket100m: number;
};

type VerifiedLocationResolution = {
  administrativeDongCode: string;
  formattedAdministrativeAreaName: string;
};

type CreatedLocationResolutionToken = {
  token: string;
  expiresAt: number;
};

function getLocationResolutionTokenSecret() {
  const secret = process.env.LOCATION_RESOLUTION_TOKEN_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "LOCATION_RESOLUTION_TOKEN_SECRET must contain at least 32 characters.",
    );
  }

  return secret;
}

function encodeTokenPayload(payload: LocationResolutionTokenPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeTokenPayload(tokenPayload: string) {
  try {
    return JSON.parse(
      Buffer.from(tokenPayload, "base64url").toString("utf8"),
    ) as Partial<LocationResolutionTokenPayload>;
  } catch {
    return null;
  }
}

function signTokenPayload(tokenPayload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(tokenPayload)
    .digest("base64url");
}

function isValidTokenPayload(
  payload: Partial<LocationResolutionTokenPayload> | null,
): payload is LocationResolutionTokenPayload {
  return Boolean(
    payload &&
      payload.version === LOCATION_RESOLUTION_TOKEN_VERSION &&
      typeof payload.administrativeDongCode === "string" &&
      /^\d{10}$/.test(payload.administrativeDongCode) &&
      typeof payload.formattedAdministrativeAreaName === "string" &&
      payload.formattedAdministrativeAreaName.trim() &&
      typeof payload.expiresAt === "number" &&
      Number.isFinite(payload.expiresAt) &&
      typeof payload.latitudeBucket20m === "number" &&
      Number.isFinite(payload.latitudeBucket20m) &&
      typeof payload.longitudeBucket20m === "number" &&
      Number.isFinite(payload.longitudeBucket20m) &&
      typeof payload.latitudeBucket100m === "number" &&
      Number.isFinite(payload.latitudeBucket100m) &&
      typeof payload.longitudeBucket100m === "number" &&
      Number.isFinite(payload.longitudeBucket100m),
  );
}

export function createLocationResolutionTokenWithExpiry(input: {
  administrativeDongCode: string;
  formattedAdministrativeAreaName: string;
  location: PostLocation;
}): CreatedLocationResolutionToken {
  const secret = getLocationResolutionTokenSecret();

  if (
    !/^\d{10}$/.test(input.administrativeDongCode) ||
    !input.formattedAdministrativeAreaName.trim()
  ) {
    throw new Error("INVALID_LOCATION_RESOLUTION_TOKEN_INPUT");
  }

  const lookupCell = quantizeLocationTo20MeterGrid(input.location);
  const storageCell = quantizeLocationTo100MeterGrid(input.location);
  const expiresAt = Date.now() + LOCATION_RESOLUTION_TOKEN_TTL_MS;
  const tokenPayload = encodeTokenPayload({
    version: LOCATION_RESOLUTION_TOKEN_VERSION,
    administrativeDongCode: input.administrativeDongCode,
    formattedAdministrativeAreaName:
      input.formattedAdministrativeAreaName.trim(),
    expiresAt,
    latitudeBucket20m: lookupCell.latitudeBucket20m,
    longitudeBucket20m: lookupCell.longitudeBucket20m,
    latitudeBucket100m: storageCell.latitudeBucket100m,
    longitudeBucket100m: storageCell.longitudeBucket100m,
  });

  return {
    token: `${tokenPayload}.${signTokenPayload(tokenPayload, secret)}`,
    expiresAt,
  };
}

export function verifyLocationResolutionToken(
  token: string | null | undefined,
  location: PostLocation,
): VerifiedLocationResolution | null {
  const secret = getLocationResolutionTokenSecret();

  if (!token?.trim()) {
    return null;
  }

  const [tokenPayload, signature, ...rest] = token.split(".");

  if (!tokenPayload || !signature || rest.length > 0) {
    return null;
  }

  const expectedSignature = signTokenPayload(tokenPayload, secret);
  const providedSignatureBuffer = Buffer.from(signature, "utf8");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  const payload = decodeTokenPayload(tokenPayload);

  if (!isValidTokenPayload(payload) || payload.expiresAt < Date.now()) {
    return null;
  }

  const lookupCell = quantizeLocationTo20MeterGrid(location);
  const storageCell = quantizeLocationTo100MeterGrid(location);

  if (
    payload.latitudeBucket20m !== lookupCell.latitudeBucket20m ||
    payload.longitudeBucket20m !== lookupCell.longitudeBucket20m ||
    payload.latitudeBucket100m !== storageCell.latitudeBucket100m ||
    payload.longitudeBucket100m !== storageCell.longitudeBucket100m
  ) {
    return null;
  }

  return {
    administrativeDongCode: payload.administrativeDongCode,
    formattedAdministrativeAreaName:
      payload.formattedAdministrativeAreaName.trim(),
  };
}

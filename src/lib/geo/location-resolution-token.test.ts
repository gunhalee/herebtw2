import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocationResolutionTokenWithExpiry,
  verifyLocationResolutionToken,
} from "./location-resolution-token";

const TOKEN_SECRET = "test-location-token-secret-at-least-32-characters";
const LOCATION = { latitude: 37.5665, longitude: 126.978 };

describe("location resolution token v4", () => {
  beforeEach(() => {
    process.env.LOCATION_RESOLUTION_TOKEN_SECRET = TOKEN_SECRET;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-06T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.LOCATION_RESOLUTION_TOKEN_SECRET;
  });

  it("binds the Kakao administrative result to both grid sizes", () => {
    const created = createLocationResolutionTokenWithExpiry({
      administrativeDongCode: "1111051500",
      formattedAdministrativeAreaName: "서울특별시 종로구 청운효자동",
      location: LOCATION,
    });

    expect(verifyLocationResolutionToken(created.token, LOCATION)).toEqual({
      administrativeDongCode: "1111051500",
      formattedAdministrativeAreaName: "서울특별시 종로구 청운효자동",
      locationSource: "browser",
      locationScope: "dong",
    });
    expect(
      verifyLocationResolutionToken(created.token, {
        latitude: LOCATION.latitude + 0.00027,
        longitude: LOCATION.longitude,
      }),
    ).toBeNull();
  });

  it("preserves a server-issued manual selection source", () => {
    const created = createLocationResolutionTokenWithExpiry({
      administrativeDongCode: "1120065000",
      formattedAdministrativeAreaName: "서울 성동구 성수1가1동",
      location: LOCATION,
      locationSource: "manual",
      locationScope: "district",
    });

    expect(verifyLocationResolutionToken(created.token, LOCATION)).toEqual({
      administrativeDongCode: "1120065000",
      formattedAdministrativeAreaName: "서울 성동구 성수1가1동",
      locationSource: "manual",
      locationScope: "district",
    });
  });

  it("binds a new token to the server-confirmed anonymous actor", () => {
    const binding = "a".repeat(64);
    const created = createLocationResolutionTokenWithExpiry({
      administrativeDongCode: "1111051500",
      formattedAdministrativeAreaName: "서울특별시 종로구 청운효자동",
      location: LOCATION,
      actorBindingHash: binding,
    });

    expect(
      verifyLocationResolutionToken(created.token, LOCATION, binding),
    ).not.toBeNull();
    expect(
      verifyLocationResolutionToken(created.token, LOCATION, "b".repeat(64)),
    ).toBeNull();
  });

  it("rejects expired, tampered, and legacy tokens", () => {
    const created = createLocationResolutionTokenWithExpiry({
      administrativeDongCode: "1111051500",
      formattedAdministrativeAreaName: "서울특별시 종로구 청운효자동",
      location: LOCATION,
    });

    vi.setSystemTime(created.expiresAt + 1);
    expect(verifyLocationResolutionToken(created.token, LOCATION)).toBeNull();

    vi.setSystemTime(new Date("2026-08-06T00:00:00.000Z"));
    expect(
      verifyLocationResolutionToken(`${created.token}x`, LOCATION),
    ).toBeNull();

    const legacyPayload = Buffer.from(
      JSON.stringify({
        administrativeDongCode: "1111051500",
        formattedAdministrativeAreaName: "legacy",
        expiresAt: Date.now() + 60000,
        latitudeBucket100m: 1,
        longitudeBucket100m: 1,
      }),
    ).toString("base64url");
    const legacySignature = createHmac("sha256", TOKEN_SECRET)
      .update(legacyPayload)
      .digest("base64url");
    expect(
      verifyLocationResolutionToken(
        `${legacyPayload}.${legacySignature}`,
        LOCATION,
      ),
    ).toBeNull();
  });

  it("requires a dedicated strong token secret and a ten-digit code", () => {
    delete process.env.LOCATION_RESOLUTION_TOKEN_SECRET;
    expect(() =>
      createLocationResolutionTokenWithExpiry({
        administrativeDongCode: "1111051500",
        formattedAdministrativeAreaName: "서울특별시 종로구 청운효자동",
        location: LOCATION,
      }),
    ).toThrow("at least 32 characters");

    process.env.LOCATION_RESOLUTION_TOKEN_SECRET = TOKEN_SECRET;
    expect(() =>
      createLocationResolutionTokenWithExpiry({
        administrativeDongCode: "invalid",
        formattedAdministrativeAreaName: "서울",
        location: LOCATION,
      }),
    ).toThrow("INVALID_LOCATION_RESOLUTION_TOKEN_INPUT");
  });
});

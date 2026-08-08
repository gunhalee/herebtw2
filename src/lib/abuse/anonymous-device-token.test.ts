import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAnonymousDeviceToken,
  verifyAnonymousDeviceToken,
} from "./anonymous-device-token";

const DEVICE_ID = "11111111-1111-4111-8111-111111111111";

describe("anonymous device token", () => {
  beforeEach(() => {
    process.env.ABUSE_DEVICE_TOKEN_SECRET =
      "test-device-token-secret-at-least-32-characters";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T00:00:00.000Z"));
  });

  afterEach(() => {
    delete process.env.ABUSE_DEVICE_TOKEN_SECRET;
    vi.useRealTimers();
  });

  it("round-trips a signed device and token version", () => {
    const token = createAnonymousDeviceToken({
      deviceId: DEVICE_ID,
      tokenVersion: 2,
    });

    expect(verifyAnonymousDeviceToken(token)).toMatchObject({
      deviceId: DEVICE_ID,
      tokenVersion: 2,
      version: 1,
    });
  });

  it("rejects tampering and expiry", () => {
    const token = createAnonymousDeviceToken({
      deviceId: DEVICE_ID,
      tokenVersion: 1,
    });

    expect(verifyAnonymousDeviceToken(`${token}x`)).toBeNull();
    vi.advanceTimersByTime(181 * 24 * 60 * 60 * 1000);
    expect(verifyAnonymousDeviceToken(token)).toBeNull();
  });
});

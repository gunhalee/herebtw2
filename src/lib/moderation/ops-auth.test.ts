import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createOpsSessionToken, parseOpsSessionToken, verifyOpsSecret } from "./ops-auth";

const originalOpsSecret = process.env.MODERATION_OPS_SECRET;
const originalEvidenceKey = process.env.MODERATION_EVIDENCE_KEY_CURRENT;

beforeEach(() => {
  process.env.MODERATION_OPS_SECRET = "12".repeat(32);
  process.env.MODERATION_EVIDENCE_KEY_CURRENT = "34".repeat(32);
});

afterEach(() => {
  process.env.MODERATION_OPS_SECRET = originalOpsSecret;
  process.env.MODERATION_EVIDENCE_KEY_CURRENT = originalEvidenceKey;
});

describe("moderation ops authentication", () => {
  it("accepts only the exact 64-hex operator secret", () => {
    expect(verifyOpsSecret("12".repeat(32))).toBe(true);
    expect(verifyOpsSecret("12".repeat(31))).toBe(false);
    expect(verifyOpsSecret("34".repeat(32))).toBe(false);
  });

  it("creates a signed 12-hour-bounded session and rejects tampering", () => {
    const { token, maxAge } = createOpsSessionToken();
    expect(maxAge).toBeLessThanOrEqual(43200);
    expect(parseOpsSessionToken(token)?.operatorId).toBe("lee-geonha");
    expect(parseOpsSessionToken(`${token.slice(0, -1)}x`)).toBeNull();
  });

  it("fails closed when auth and evidence keys are reused", () => {
    process.env.MODERATION_EVIDENCE_KEY_CURRENT = process.env.MODERATION_OPS_SECRET;
    expect(() => createOpsSessionToken()).toThrow(/must be different/u);
  });
});

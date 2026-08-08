import { afterEach, describe, expect, it } from "vitest";
import { decryptModerationEvidence, encryptModerationEvidence } from "./evidence-crypto";

const ORIGINAL_KEY = process.env.MODERATION_EVIDENCE_KEY_CURRENT;
const ORIGINAL_VERSION = process.env.MODERATION_EVIDENCE_KEY_CURRENT_VERSION;

afterEach(() => {
  process.env.MODERATION_EVIDENCE_KEY_CURRENT = ORIGINAL_KEY;
  process.env.MODERATION_EVIDENCE_KEY_CURRENT_VERSION = ORIGINAL_VERSION;
});

describe("moderation evidence encryption", () => {
  it("round-trips with AES-256-GCM bound to case and policy", () => {
    process.env.MODERATION_EVIDENCE_KEY_CURRENT = "ab".repeat(32);
    process.env.MODERATION_EVIDENCE_KEY_CURRENT_VERSION = "v-test";
    const encrypted = encryptModerationEvidence({
      casePublicId: "7a6b6bf5-d72d-4b77-a36d-6c911258ec74",
      content: "격리 원문",
      policyVersion: "test-policy",
    });
    expect(decryptModerationEvidence({
      ...encrypted,
      casePublicId: "7a6b6bf5-d72d-4b77-a36d-6c911258ec74",
      policyVersion: "test-policy",
    })).toBe("격리 원문");
  });

  it("decrypts after PostgREST rewrites an equivalent timestamptz", () => {
    process.env.MODERATION_EVIDENCE_KEY_CURRENT = "bc".repeat(32);
    process.env.MODERATION_EVIDENCE_KEY_CURRENT_VERSION = "v-test";
    const encrypted = encryptModerationEvidence({
      casePublicId: "9f06fab5-f34f-467a-866f-172f4de29c41",
      content: "DB 왕복 원문",
      createdAt: "2026-08-08T21:23:29.380Z",
      policyVersion: "test-policy",
    });

    expect(decryptModerationEvidence({
      ...encrypted,
      createdAt: "2026-08-08T21:23:29.38+00:00",
      casePublicId: "9f06fab5-f34f-467a-866f-172f4de29c41",
      policyVersion: "test-policy",
    })).toBe("DB 왕복 원문");
  });

  it("still fails closed when the evidence timestamp changes", () => {
    process.env.MODERATION_EVIDENCE_KEY_CURRENT = "de".repeat(32);
    process.env.MODERATION_EVIDENCE_KEY_CURRENT_VERSION = "v-test";
    const encrypted = encryptModerationEvidence({
      casePublicId: "case-time",
      content: "원문",
      createdAt: "2026-08-08T21:23:29.380Z",
      policyVersion: "p1",
    });

    expect(() => decryptModerationEvidence({
      ...encrypted,
      createdAt: "2026-08-08T21:23:30.380Z",
      casePublicId: "case-time",
      policyVersion: "p1",
    })).toThrow();
  });

  it("fails closed when AAD is changed", () => {
    process.env.MODERATION_EVIDENCE_KEY_CURRENT = "cd".repeat(32);
    process.env.MODERATION_EVIDENCE_KEY_CURRENT_VERSION = "v-test";
    const encrypted = encryptModerationEvidence({ casePublicId: "case-a", content: "원문", policyVersion: "p1" });
    expect(() => decryptModerationEvidence({ ...encrypted, casePublicId: "case-b", policyVersion: "p1" })).toThrow();
  });
});

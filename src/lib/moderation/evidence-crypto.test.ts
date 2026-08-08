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

  it("fails closed when AAD is changed", () => {
    process.env.MODERATION_EVIDENCE_KEY_CURRENT = "cd".repeat(32);
    process.env.MODERATION_EVIDENCE_KEY_CURRENT_VERSION = "v-test";
    const encrypted = encryptModerationEvidence({ casePublicId: "case-a", content: "원문", policyVersion: "p1" });
    expect(() => decryptModerationEvidence({ ...encrypted, casePublicId: "case-b", policyVersion: "p1" })).toThrow();
  });
});

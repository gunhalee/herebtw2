import { describe, expect, it } from "vitest";
import {
  normalizeModerationEvidenceRelation,
  type ModerationEvidenceRow,
} from "./evidence-relation";

const evidence: ModerationEvidenceRow = {
  aad_version: 1,
  auth_tag_base64: "auth-tag",
  ciphertext_base64: "ciphertext",
  created_at: "2026-08-08T21:46:00.006+00:00",
  key_version: "v1",
  nonce_base64: "nonce",
};

describe("moderation evidence relation normalization", () => {
  it("accepts the one-to-one object returned by PostgREST", () => {
    expect(normalizeModerationEvidenceRelation(evidence)).toBe(evidence);
  });

  it("keeps compatibility with an embedded relation array", () => {
    expect(normalizeModerationEvidenceRelation([evidence])).toBe(evidence);
  });

  it("normalizes missing evidence to null", () => {
    expect(normalizeModerationEvidenceRelation(null)).toBeNull();
    expect(normalizeModerationEvidenceRelation([])).toBeNull();
  });
});

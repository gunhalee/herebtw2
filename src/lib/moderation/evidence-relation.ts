export type ModerationEvidenceRow = {
  aad_version: 1;
  auth_tag_base64: string;
  ciphertext_base64: string;
  created_at: string;
  key_version: string;
  nonce_base64: string;
};

export type ModerationCaseEvidenceRow = {
  id: string;
  content_decision_key: string;
  public_id: string;
  policy_version: string;
  provider_status: string;
  state: "open" | "published" | "rejected";
  moderation_evidence: ModerationEvidenceRow | null;
};

export type ModerationCaseEvidenceApiRow = Omit<
  ModerationCaseEvidenceRow,
  "moderation_evidence"
> & {
  moderation_evidence: ModerationEvidenceRow | ModerationEvidenceRow[] | null;
};

export function normalizeModerationEvidenceRelation(
  value: ModerationCaseEvidenceApiRow["moderation_evidence"],
) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

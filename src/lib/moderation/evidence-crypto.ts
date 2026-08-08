import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedModerationEvidence = {
  aadVersion: 1;
  authTagBase64: string;
  ciphertextBase64: string;
  createdAt: string;
  keyVersion: string;
  nonceBase64: string;
};

function readHexKey(name: string) {
  const value = process.env[name]?.trim();
  if (!value || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${name} must be a lowercase 64-character hex key.`);
  }
  if (value === process.env.MODERATION_OPS_SECRET?.trim()) {
    throw new Error("Moderation evidence and ops authentication keys must be different.");
  }
  return Buffer.from(value, "hex");
}

function buildAad(input: { casePublicId: string; createdAt: string; policyVersion: string }) {
  return Buffer.from(
    JSON.stringify({
      aadVersion: 1,
      casePublicId: input.casePublicId,
      createdAt: input.createdAt,
      policyVersion: input.policyVersion,
    }),
    "utf8",
  );
}

export function encryptModerationEvidence(input: {
  casePublicId: string;
  content: string;
  createdAt?: string;
  policyVersion: string;
}): EncryptedModerationEvidence {
  const key = readHexKey("MODERATION_EVIDENCE_KEY_CURRENT");
  const keyVersion = process.env.MODERATION_EVIDENCE_KEY_CURRENT_VERSION?.trim();
  if (!keyVersion) throw new Error("Missing MODERATION_EVIDENCE_KEY_CURRENT_VERSION.");
  const nonce = randomBytes(12);
  const createdAt = input.createdAt ?? new Date().toISOString();
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(buildAad({ ...input, createdAt }));
  const ciphertext = Buffer.concat([cipher.update(input.content, "utf8"), cipher.final()]);

  return {
    aadVersion: 1,
    authTagBase64: cipher.getAuthTag().toString("base64"),
    ciphertextBase64: ciphertext.toString("base64"),
    createdAt,
    keyVersion,
    nonceBase64: nonce.toString("base64"),
  };
}

function resolveEvidenceKey(version: string) {
  if (version === process.env.MODERATION_EVIDENCE_KEY_CURRENT_VERSION?.trim()) {
    return readHexKey("MODERATION_EVIDENCE_KEY_CURRENT");
  }
  if (version === process.env.MODERATION_EVIDENCE_KEY_PREVIOUS_VERSION?.trim()) {
    return readHexKey("MODERATION_EVIDENCE_KEY_PREVIOUS");
  }
  throw new Error("Unknown moderation evidence key version.");
}

export function decryptModerationEvidence(input: EncryptedModerationEvidence & {
  casePublicId: string;
  policyVersion: string;
}) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    resolveEvidenceKey(input.keyVersion),
    Buffer.from(input.nonceBase64, "base64"),
  );
  decipher.setAAD(buildAad(input));
  decipher.setAuthTag(Buffer.from(input.authTagBase64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(input.ciphertextBase64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

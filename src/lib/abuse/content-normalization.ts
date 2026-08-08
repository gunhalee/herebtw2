import { createHash } from "node:crypto";

const ZERO_WIDTH_CHARACTERS = /[\u200B-\u200D\u2060\uFEFF]/gu;
const WHITESPACE = /\s+/gu;
const LOOSE_SEPARATORS = /[\p{P}\p{S}\s]+/gu;

export function normalizeContentStrict(content: string) {
  return content
    .normalize("NFKC")
    .replace(ZERO_WIDTH_CHARACTERS, "")
    .toLocaleLowerCase("ko-KR")
    .replace(WHITESPACE, " ")
    .trim();
}

export function normalizeContentLoose(content: string) {
  return normalizeContentStrict(content).replace(LOOSE_SEPARATORS, "");
}

export function fingerprintContent(content: string) {
  const strict = normalizeContentStrict(content);

  return {
    fingerprint: createHash("sha256").update(strict, "utf8").digest("hex"),
    loose: normalizeContentLoose(content),
    strict,
    version: 1,
  };
}

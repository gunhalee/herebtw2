import { createHash } from "node:crypto";

const DEFAULT_IGNORABLE_CHARACTERS = /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0]/gu;
const WHITESPACE = /\s+/gu;
const LOOSE_SEPARATORS = /[\p{P}\p{S}\s]+/gu;

const CONFUSABLE_CHARACTERS: Readonly<Record<string, string>> = {
  "0": "ㅇ",
  "1": "ㅣ",
  "3": "ㅌ",
  "5": "ㅅ",
  "7": "ㄱ",
  "@": "아",
  i: "ㅣ",
  l: "ㅣ",
  o: "ㅇ",
};

const JAMO_TO_COMPATIBILITY: Readonly<Record<string, string>> = {
  "ᄀ": "ㄱ", "ᄁ": "ㄲ", "ᄂ": "ㄴ", "ᄃ": "ㄷ", "ᄄ": "ㄸ",
  "ᄅ": "ㄹ", "ᄆ": "ㅁ", "ᄇ": "ㅂ", "ᄈ": "ㅃ", "ᄉ": "ㅅ",
  "ᄊ": "ㅆ", "ᄋ": "ㅇ", "ᄌ": "ㅈ", "ᄍ": "ㅉ", "ᄎ": "ㅊ",
  "ᄏ": "ㅋ", "ᄐ": "ㅌ", "ᄑ": "ㅍ", "ᄒ": "ㅎ", "ᅡ": "ㅏ",
  "ᅢ": "ㅐ", "ᅣ": "ㅑ", "ᅤ": "ㅒ", "ᅥ": "ㅓ", "ᅦ": "ㅔ",
  "ᅧ": "ㅕ", "ᅨ": "ㅖ", "ᅩ": "ㅗ", "ᅪ": "ㅘ", "ᅫ": "ㅙ",
  "ᅬ": "ㅚ", "ᅭ": "ㅛ", "ᅮ": "ㅜ", "ᅯ": "ㅝ", "ᅰ": "ㅞ",
  "ᅱ": "ㅟ", "ᅲ": "ㅠ", "ᅳ": "ㅡ", "ᅴ": "ㅢ", "ᅵ": "ㅣ",
  "ᆨ": "ㄱ", "ᆩ": "ㄲ", "ᆫ": "ㄴ", "ᆮ": "ㄷ", "ᆯ": "ㄹ",
  "ᆷ": "ㅁ", "ᆸ": "ㅂ", "ᆺ": "ㅅ", "ᆻ": "ㅆ", "ᆼ": "ㅇ",
  "ᆽ": "ㅈ", "ᆾ": "ㅊ", "ᆿ": "ㅋ", "ᇀ": "ㅌ", "ᇁ": "ㅍ", "ᇂ": "ㅎ",
};

export type ModerationTextViews = {
  original: string;
  strict: string;
  loose: string;
  hangulSkeleton: string;
  confusableSkeleton: string;
  tokenView: string[];
  normalizationVersion: 2;
};

export function normalizeContentStrict(content: string) {
  return content
    .normalize("NFKC")
    .replace(DEFAULT_IGNORABLE_CHARACTERS, "")
    .toLocaleLowerCase("ko-KR")
    .replace(WHITESPACE, " ")
    .trim();
}

function toHangulSkeleton(content: string) {
  return content
    .normalize("NFD")
    .replace(/[\u1100-\u11FF]/gu, (character) =>
      JAMO_TO_COMPATIBILITY[character] ?? character,
    )
    .replace(LOOSE_SEPARATORS, "");
}

function toConfusableSkeleton(content: string) {
  return [...content]
    .map((character) => CONFUSABLE_CHARACTERS[character] ?? character)
    .join("");
}

export function createModerationTextViews(content: string): ModerationTextViews {
  const strict = normalizeContentStrict(content);
  const loose = normalizeContentLoose(content);

  return {
    original: content,
    strict,
    loose,
    hangulSkeleton: toHangulSkeleton(strict),
    confusableSkeleton: toConfusableSkeleton(loose),
    tokenView: strict.match(/[\p{L}\p{N}]+/gu) ?? [],
    normalizationVersion: 2,
  };
}

export function normalizeContentLoose(content: string) {
  return normalizeContentStrict(content).replace(LOOSE_SEPARATORS, "");
}

export function fingerprintContent(content: string) {
  const views = createModerationTextViews(content);

  return {
    fingerprint: createHash("sha256").update(views.strict, "utf8").digest("hex"),
    loose: views.loose,
    strict: views.strict,
    version: views.normalizationVersion,
  };
}

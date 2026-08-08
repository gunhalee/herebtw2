export const MODERATION_POLICY_VERSION =
  process.env.MODERATION_RULES_VERSION?.trim() || "ko-safety-2026-08-v1";

export const MODERATION_BLOCK_MESSAGE =
  "게시할 수 없는 표현이 포함되어 있어요. 표현을 바꿔주세요.";
export const MODERATION_CONTACT_MESSAGE =
  "개인정보나 연락처는 글에 포함할 수 없어요.";
export const MODERATION_THREAT_MESSAGE =
  "위협하거나 위해를 암시하는 표현은 게시할 수 없어요.";
export const MODERATION_QUARANTINE_MESSAGE =
  "내용을 안전하게 확인하고 있어요. 확인이 끝나면 게시 여부가 반영됩니다.";
export const MODERATION_PLACEHOLDER_CONTENT = "안전 확인 중인 글입니다.";

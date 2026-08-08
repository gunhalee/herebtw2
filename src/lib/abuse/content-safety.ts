const PHONE_NUMBER = /(?:^|\D)(?:01[016789][ -]?\d{3,4}[ -]?\d{4})(?:\D|$)/u;
const EMAIL_ADDRESS = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/iu;
const WEB_LINK = /(?:https?:\/\/|www\.)\S+/iu;
const DIRECT_THREATS = [
  /죽여\s*버리/u,
  /살해\s*(?:하|해|한다|할)/u,
  /폭파\s*(?:하|해|한다|할)/u,
];

export function evaluateContentSafety(content: string) {
  if (PHONE_NUMBER.test(content) || EMAIL_ADDRESS.test(content)) {
    return {
      allowed: false as const,
      message: "전화번호나 이메일 주소는 글에 포함할 수 없어요.",
      ruleCode: "personal_contact_information",
    };
  }

  if (WEB_LINK.test(content)) {
    return {
      allowed: false as const,
      message: "링크는 글에 포함할 수 없어요.",
      ruleCode: "external_link",
    };
  }

  if (DIRECT_THREATS.some((pattern) => pattern.test(content))) {
    return {
      allowed: false as const,
      message: "위협하는 표현은 게시할 수 없어요.",
      ruleCode: "direct_threat",
    };
  }

  return { allowed: true as const };
}

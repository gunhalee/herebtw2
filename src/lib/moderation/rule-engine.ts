import type { ModerationRuleMatch } from "./types";
import { createModerationTextViews, type ModerationTextViews } from "../abuse/content-normalization";

const PHONE_NUMBER = /(?:^|\D)(?:01[016789][ ._-]?\d{3,4}[ ._-]?\d{4})(?:\D|$)/u;
const EMAIL_ADDRESS = /[a-z0-9._%+-]+\s*(?:@|\(at\))\s*[a-z0-9.-]+\.[a-z]{2,}/iu;
const WEB_LINK = /(?:h(?:tt|xx)ps?:\/\/|www\.|(?:bit\.ly|t\.me|open\.kakao\.com)\/|[a-z0-9-]+(?:\.|\s*(?:\[?dot\]?|닷)\s*)(?:com|net|org|kr)(?:\/|\b))/iu;
const ACCOUNT_NUMBER = /(?:계좌|입금|송금).{0,12}\b\d{2,6}[- ]?\d{2,6}[- ]?\d{2,8}\b/u;

const SAFE_PROFANITY_CONTEXTS = ["시발점", "개발", "개발자", "개발원", "개발비", "개발팀"];
const EXPLICIT_PROFANITY = [
  /씨+[이ㅣ1l]*발+/iu,
  /시+[이ㅣ1l]*발+/iu,
  /ㅅ[ㅣ1l]ㅂㅏㄹ/iu,
  /병+신+/u,
  /ㅂㅕㅇㅅㅣㄴ/u,
  /좆+/u,
  /ㅈㅗㅈ/u,
  /개+새+[끼기]+/u,
  /ㄱㅐㅅㅐㄲ[ㅣ1l]/iu,
  /꺼+져+/u,
  /(?:ㅅ+ㅂ+|ㅂ+ㅅ+|ㅈ+ㄹ+|ㄲ+ㅈ+)/u,
  /t[l1]qk[f1]/iu,
  /tqk[f1]/iu,
];
const DIRECT_THREATS = [
  /(?:너|니가|당신|저 사람|후보).{0,12}(?:죽여|죽인다|죽일|살해|패버|폭행|불태워|칼로)/u,
  /(?:죽여|살해|폭파|방화|칼로 찔러).{0,12}(?:버리|주겠|하겠|한다)/u,
];
const SEXUAL_MINOR_RISK = [
  /(?:미성년|아동|초등학생|중학생).{0,16}(?:성관계|야동|벗은|나체|성매매)/u,
  /(?:성관계|야동|나체|성매매).{0,16}(?:미성년|아동|초등학생|중학생)/u,
];
const SELF_HARM_ENCOURAGEMENT = [
  /(?:자살|목숨을 끊|죽어버려|스스로 죽).{0,16}(?:해라|하세요|하는 법|방법|추천)/u,
  /(?:손목|목을).{0,10}(?:그어|매달).{0,8}(?:라|봐|방법)/u,
];
const SELF_HARM_RISK = [/(?:자살하고|죽고|목숨을 끊고|사라지고)\s*싶/u];
const SEXUAL_EXPLICIT = [
  /(?:성관계|성행위|성교|오럴|애널).{0,12}(?:하자|하고 싶|요구|강요|묘사)/u,
  /(?:나체|알몸|음란물|야동).{0,12}(?:보내|공유|구해|판매)/u,
];
const HATE = [
  /(?:여성|남성|장애인|외국인|이주민|동성애자|무슬림).{0,12}(?:벌레|박멸|추방|열등|인간도 아)/u,
  /(?:벌레|박멸|추방|열등).{0,12}(?:여성|남성|장애인|외국인|이주민|동성애자|무슬림)/u,
];
const OBVIOUS_SPAM = [
  /(?:대출|코인|투자|부업).{0,18}(?:수익 보장|원금 보장|무료 상담|선착순|오픈채팅)/u,
  /(?:광고|홍보).{0,12}(?:문의|연락|오픈채팅)/u,
];

const SAFE_PROFANITY_VIEWS = SAFE_PROFANITY_CONTEXTS.map((content) =>
  createModerationTextViews(content),
);

function match(input: Omit<ModerationRuleMatch, "code"> & { code: string }) {
  return input;
}

function hasAny(patterns: readonly RegExp[], value: string) {
  return patterns.some((pattern) => pattern.test(value));
}

export function evaluateModerationRules(views: ModerationTextViews) {
  const matches: ModerationRuleMatch[] = [];

  if (PHONE_NUMBER.test(views.strict) || EMAIL_ADDRESS.test(views.strict) || ACCOUNT_NUMBER.test(views.strict)) {
    matches.push(match({ category: "personal_information", code: "personal_contact_information", disposition: "block", priority: "high", riskBand: "high" }));
  }
  if (WEB_LINK.test(views.strict)) {
    matches.push(match({ category: "scam_or_malicious_link", code: "external_link", disposition: "block", priority: "normal", riskBand: "medium" }));
  }

  const stripSafeContexts = (value: string, key: "confusableSkeleton" | "hangulSkeleton" | "loose" | "strict") =>
    SAFE_PROFANITY_VIEWS.reduce((current, safeViews) => current.replaceAll(safeViews[key], ""), value);
  const profanitySearchable = [
    stripSafeContexts(views.strict, "strict"),
    stripSafeContexts(views.loose, "loose"),
    stripSafeContexts(views.confusableSkeleton, "confusableSkeleton"),
    stripSafeContexts(views.hangulSkeleton, "hangulSkeleton"),
  ].join("\n");
  if (hasAny(EXPLICIT_PROFANITY, profanitySearchable)) {
    matches.push(match({ category: "profanity", code: "explicit_profanity", disposition: "block", priority: "normal", riskBand: "medium" }));
  }
  if (hasAny(OBVIOUS_SPAM, views.strict)) {
    matches.push(match({ category: "spam_or_ad", code: "obvious_spam_or_ad", disposition: "block", priority: "normal", riskBand: "medium" }));
  }
  if (hasAny(DIRECT_THREATS, views.strict)) {
    matches.push(match({ category: "direct_threat", code: "direct_threat", disposition: "quarantine", priority: "urgent", riskBand: "critical" }));
  }
  if (hasAny(SEXUAL_MINOR_RISK, views.strict)) {
    matches.push(match({ category: "sexual_minor_risk", code: "sexual_minor_risk", disposition: "quarantine", priority: "urgent", riskBand: "critical" }));
  }
  if (hasAny(SELF_HARM_ENCOURAGEMENT, views.strict)) {
    matches.push(match({ category: "self_harm_encouragement", code: "self_harm_encouragement", disposition: "quarantine", priority: "urgent", riskBand: "critical" }));
  }
  if (hasAny(SELF_HARM_RISK, views.strict)) {
    matches.push(match({ category: "self_harm_risk", code: "self_harm_risk", disposition: "quarantine", priority: "urgent", riskBand: "high" }));
  }
  if (hasAny(SEXUAL_EXPLICIT, views.strict)) {
    matches.push(match({ category: "sexual_explicit", code: "sexual_explicit_context", disposition: "quarantine", priority: "high", riskBand: "high" }));
  }
  if (hasAny(HATE, views.strict)) {
    matches.push(match({ category: "hate_or_dehumanization", code: "hate_or_dehumanization", disposition: "quarantine", priority: "high", riskBand: "high" }));
  }

  return matches;
}

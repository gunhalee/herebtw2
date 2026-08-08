import type { ModerationTextViews } from "../abuse/content-normalization";

export type ModerationCategory =
  | "direct_threat"
  | "hate_or_dehumanization"
  | "personal_information"
  | "profanity"
  | "scam_or_malicious_link"
  | "self_harm_encouragement"
  | "self_harm_risk"
  | "sexual_explicit"
  | "sexual_minor_risk"
  | "spam_or_ad"
  | "targeted_harassment";

export type ModerationAction = "allow" | "block" | "quarantine";
export type ModerationRiskBand = "low" | "medium" | "high" | "critical";
export type ModerationPriority = "normal" | "high" | "urgent";
export type ModerationProfile = "candidate_first_message" | "citizen_post";

export type ModerationRuleMatch = {
  category: ModerationCategory;
  code: string;
  disposition: Exclude<ModerationAction, "allow">;
  priority: ModerationPriority;
  riskBand: Exclude<ModerationRiskBand, "low">;
};

export type ModerationAssessment = {
  action: ModerationAction;
  contentDecisionKey: string;
  matches: ModerationRuleMatch[];
  message?: string;
  normalizationVersion: 2;
  policyVersion: string;
  priority: ModerationPriority;
  profile: ModerationProfile;
  reasonCodes: string[];
  riskBand: ModerationRiskBand;
  views: ModerationTextViews;
};

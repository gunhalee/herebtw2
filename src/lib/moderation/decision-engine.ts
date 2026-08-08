import { createHmac } from "node:crypto";
import { createModerationTextViews } from "../abuse/content-normalization";
import {
  MODERATION_BLOCK_MESSAGE,
  MODERATION_CONTACT_MESSAGE,
  MODERATION_POLICY_VERSION,
  MODERATION_QUARANTINE_MESSAGE,
} from "./policy";
import { evaluateModerationRules } from "./rule-engine";
import type {
  ModerationAssessment,
  ModerationPriority,
  ModerationProfile,
  ModerationRiskBand,
} from "./types";

const RISK_ORDER: ModerationRiskBand[] = ["low", "medium", "high", "critical"];
const PRIORITY_ORDER: ModerationPriority[] = ["normal", "high", "urgent"];

function highest<T extends string>(values: T[], order: readonly T[], fallback: T) {
  return values.reduce(
    (current, value) => order.indexOf(value) > order.indexOf(current) ? value : current,
    fallback,
  );
}

function getDecisionKeySecret() {
  const value = process.env.MODERATION_DECISION_KEY_SECRET?.trim()
    || process.env.ABUSE_SUBJECT_HASH_SECRET?.trim()
    || process.env.ABUSE_DEVICE_TOKEN_SECRET?.trim();
  if (!value) {
    if (process.env.NODE_ENV === "test") return "test-moderation-decision-key";
    throw new Error("Missing MODERATION_DECISION_KEY_SECRET.");
  }
  return value;
}

export function evaluateModerationContent(input: {
  content: string;
  profile: ModerationProfile;
}): ModerationAssessment {
  const views = createModerationTextViews(input.content);
  const matches = evaluateModerationRules(views);
  const hasBlock = matches.some((item) => item.disposition === "block");
  const hasQuarantine = matches.some((item) => item.disposition === "quarantine");
  const hasCriticalQuarantine = matches.some(
    (item) => item.disposition === "quarantine" && item.riskBand === "critical",
  );
  const action = hasCriticalQuarantine
    ? "quarantine"
    : hasBlock
      ? "block"
      : hasQuarantine
        ? "quarantine"
        : "allow";
  const reasonCodes = [...new Set(matches.map((item) => item.code))];
  const contentDecisionKey = createHmac("sha256", getDecisionKeySecret())
    .update(`${MODERATION_POLICY_VERSION}\u0000${views.strict}`, "utf8")
    .digest("hex");

  return {
    action,
    contentDecisionKey,
    matches,
    message:
      action === "quarantine"
        ? MODERATION_QUARANTINE_MESSAGE
        : matches.some((item) => item.category === "personal_information")
          ? MODERATION_CONTACT_MESSAGE
          : action === "block"
            ? MODERATION_BLOCK_MESSAGE
            : undefined,
    normalizationVersion: views.normalizationVersion,
    policyVersion: MODERATION_POLICY_VERSION,
    priority: highest(matches.map((item) => item.priority), PRIORITY_ORDER, "normal"),
    profile: input.profile,
    reasonCodes,
    riskBand: highest(matches.map((item) => item.riskBand), RISK_ORDER, "low"),
    views,
  };
}

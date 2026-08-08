import { evaluateModerationContent } from "../moderation/decision-engine";

export function evaluateContentSafety(content: string) {
  const assessment = evaluateModerationContent({
    content,
    profile: "citizen_post",
  });

  if (assessment.action !== "allow") {
    return {
      allowed: false as const,
      message: assessment.message ?? "게시할 수 없는 내용이 포함되어 있어요.",
      ruleCode: assessment.reasonCodes[0] ?? "unsafe_content",
    };
  }

  return { allowed: true as const };
}

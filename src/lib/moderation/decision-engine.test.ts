import { describe, expect, it } from "vitest";
import { createModerationTextViews } from "../abuse/content-normalization";
import { evaluateModerationContent } from "./decision-engine";

describe("moderation decision engine", () => {
  it.each(["시발", "시1발", "ㅅㅣㅂㅏㄹ", "씨---발", "개 새 끼", "ㅅㅂ", "tlqkf"])(
    "blocks explicit or obfuscated profanity: %s",
    (content) => {
      const result = evaluateModerationContent({ content, profile: "citizen_post" });
      expect(result.action).toBe("block");
      expect(result.reasonCodes).toContain("explicit_profanity");
    },
  );

  it.each(["이 정책의 시발점을 다시 정해야 합니다", "지역 개발 계획을 알려주세요"])(
    "allows known normal compound contexts: %s",
    (content) => {
      expect(evaluateModerationContent({ content, profile: "citizen_post" }).action).toBe("allow");
    },
  );

  it("does not let a safe compound mask a separate explicit profanity", () => {
    expect(evaluateModerationContent({ content: "시발점을 검토하라고 시발", profile: "citizen_post" }).action).toBe("block");
  });

  it("quarantines direct self-harm ideation for urgent review", () => {
    const result = evaluateModerationContent({ content: "요즘 죽고 싶어요", profile: "citizen_post" });
    expect(result.action).toBe("quarantine");
    expect(result.reasonCodes).toContain("self_harm_risk");
  });

  it("blocks contact information and links without echoing the match", () => {
    const result = evaluateModerationContent({
      content: "연락처 010-1234-5678로 연락주세요",
      profile: "citizen_post",
    });
    expect(result.action).toBe("block");
    expect(result.message).not.toContain("010");
  });

  it.each([
    ["너를 찾아가서 죽여버리겠다", "direct_threat"],
    ["미성년자 나체 사진을 보내", "sexual_minor_risk"],
    ["자살하는 방법을 추천한다", "self_harm_encouragement"],
  ])("quarantines critical evidence: %s", (content, reasonCode) => {
    const result = evaluateModerationContent({ content, profile: "citizen_post" });
    expect(result.action).toBe("quarantine");
    expect(result.riskBand).toBe("critical");
    expect(result.reasonCodes).toContain(reasonCode);
  });

  it("creates versioned Korean and confusable views", () => {
    const views = createModerationTextViews("ㅅㅣ 1 발\u200b");
    expect(views.normalizationVersion).toBe(2);
    expect(views.confusableSkeleton).not.toContain("1");
    expect(views.strict).not.toContain("\u200b");
  });
});

import { describe, expect, it } from "vitest";
import { formatReplyContentForCard } from "./card-text";

describe("reply card text", () => {
  it("keeps short replies unchanged", () => {
    expect(formatReplyContentForCard(" 답변입니다. ")).toBe("답변입니다.");
  });

  it("truncates expanded replies to the card-safe length", () => {
    const result = formatReplyContentForCard("가".repeat(2000));

    expect(result).toHaveLength(200);
    expect(result.endsWith("…")).toBe(true);
  });
});

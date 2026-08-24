import { describe, expect, it } from "vitest";
import {
  CANDIDATE_REPLY_MAX_LENGTH,
  isCandidateReplyLengthValid,
} from "./policy";

describe("candidate reply length policy", () => {
  it("accepts replies from 1 through 2,000 trimmed characters", () => {
    expect(isCandidateReplyLengthValid(" 답변 ")).toBe(true);
    expect(
      isCandidateReplyLengthValid("가".repeat(CANDIDATE_REPLY_MAX_LENGTH)),
    ).toBe(true);
  });

  it("rejects empty and over-limit replies", () => {
    expect(isCandidateReplyLengthValid("   ")).toBe(false);
    expect(
      isCandidateReplyLengthValid(
        "가".repeat(CANDIDATE_REPLY_MAX_LENGTH + 1),
      ),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { evaluateContentSafety } from "./content-safety";

describe("content safety rules", () => {
  it("allows ordinary political criticism", () => {
    expect(evaluateContentSafety("우리 동네 공약을 더 구체적으로 밝혀주세요")).toEqual({
      allowed: true,
    });
  });

  it("rejects contact details, links, and direct threats", () => {
    expect(evaluateContentSafety("연락처 010-1234-5678").allowed).toBe(false);
    expect(evaluateContentSafety("https://example.com 확인").allowed).toBe(false);
    expect(evaluateContentSafety("너를 죽여버리겠다").allowed).toBe(false);
  });
});

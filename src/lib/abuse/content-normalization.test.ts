import { describe, expect, it } from "vitest";
import {
  fingerprintContent,
  normalizeContentLoose,
  normalizeContentStrict,
} from "./content-normalization";

describe("abuse content normalization", () => {
  it("collapses Unicode width, zero-width characters, case and whitespace", () => {
    expect(normalizeContentStrict("  ＡBC\u200B   테스트  ")).toBe("abc 테스트");
  });

  it("builds a punctuation-insensitive loose form", () => {
    expect(normalizeContentLoose("같은-말! 입니다.")).toBe("같은말입니다");
  });

  it("creates the same fingerprint for strict-equivalent content", () => {
    expect(fingerprintContent("HELLO   시민").fingerprint).toBe(
      fingerprintContent("hello 시민").fingerprint,
    );
  });
});

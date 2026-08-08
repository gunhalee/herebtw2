import { afterEach, describe, expect, it } from "vitest";
import { shouldUseGoogleModeration } from "./google-moderate-text";

const originalMode = process.env.MODERATION_GOOGLE_MODE;
const originalRate = process.env.MODERATION_GOOGLE_SAMPLE_RATE;

afterEach(() => {
  process.env.MODERATION_GOOGLE_MODE = originalMode;
  process.env.MODERATION_GOOGLE_SAMPLE_RATE = originalRate;
});

describe("Google moderation sampling", () => {
  it("never exceeds the hard 10 percent configuration cap", () => {
    process.env.MODERATION_GOOGLE_MODE = "uncertain";
    process.env.MODERATION_GOOGLE_SAMPLE_RATE = "1";
    const sampled = Array.from({ length: 10000 }, (_, index) =>
      shouldUseGoogleModeration(`case-${index}`),
    ).filter(Boolean).length;
    expect(sampled).toBeLessThan(1100);
    expect(sampled).toBeGreaterThan(900);
  });

  it("is disabled when mode is off", () => {
    process.env.MODERATION_GOOGLE_MODE = "off";
    expect(shouldUseGoogleModeration("case-1")).toBe(false);
  });
});

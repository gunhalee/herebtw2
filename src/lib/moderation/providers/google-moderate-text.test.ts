import { afterEach, describe, expect, it } from "vitest";
import { shouldUseGoogleModeration } from "./google-moderate-text";

const originalMode = process.env.MODERATION_GOOGLE_MODE;
const originalRate = process.env.MODERATION_GOOGLE_SAMPLE_RATE;

function setRate(rate: string | undefined) {
  if (rate === undefined) {
    delete process.env.MODERATION_GOOGLE_SAMPLE_RATE;
    return;
  }
  process.env.MODERATION_GOOGLE_SAMPLE_RATE = rate;
}

afterEach(() => {
  process.env.MODERATION_GOOGLE_MODE = originalMode;
  setRate(originalRate);
});

describe("Google moderation sampling", () => {
  it("sends every case when the rate is left unset", () => {
    process.env.MODERATION_GOOGLE_MODE = "shadow";
    setRate(undefined);
    const sampled = Array.from({ length: 1000 }, (_, index) =>
      shouldUseGoogleModeration(`case-${index}`),
    ).filter(Boolean).length;
    expect(sampled).toBe(1000);
  });

  it("honours an explicit lower rate", () => {
    process.env.MODERATION_GOOGLE_MODE = "shadow";
    setRate("0.1");
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

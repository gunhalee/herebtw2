import { describe, expect, it } from "vitest";
import { BrowserLocationError } from "./browser-location-support";
import { getBrowserLocationGuidance } from "./browser-location-guidance";

describe("browser location guidance", () => {
  it("gives iOS-specific recovery steps for a denied permission", () => {
    const guidance = getBrowserLocationGuidance({
      error: new BrowserLocationError("GEOLOCATION_PERMISSION_DENIED"),
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
    });

    expect(guidance.title).toContain("권한");
    expect(guidance.steps.join(" ")).toContain("Safari");
    expect(guidance.steps.join(" ")).toContain("정확한 위치");
  });

  it("prioritizes opening an external browser for embedded browsers", () => {
    const guidance = getBrowserLocationGuidance({
      error: new BrowserLocationError("GEOLOCATION_PERMISSION_DENIED"),
      userAgent: "Mozilla/5.0 Android KAKAOTALK/25.1.0",
    });

    expect(guidance.steps[0]).toContain("Chrome으로 열기");
    expect(guidance.retryLabel).toBe("Chrome에서 열기");
    expect(guidance.retryAction).toBe("external-browser");
  });

  it("asks for one retry when coordinates are wider than 500 meters", () => {
    const guidance = getBrowserLocationGuidance({
      accuracyMeters: 850,
      userAgent: "Mozilla/5.0 Android",
    });

    expect(guidance.title).toBe("위치 오차 범위가 넓은 상태입니다.");
    expect(guidance.retryAvailable).toBe(true);
  });

  it("routes to manual area search when the retry is still wider than 2km", () => {
    const guidance = getBrowserLocationGuidance({
      accuracyMeters: 2500,
      accuracyRetryCompleted: true,
    });

    expect(guidance.title).toBe("정확한 위치를 확인할 수 없습니다.");
    expect(guidance.retryAvailable).toBe(false);
    expect(guidance.manualSearchAvailable).toBe(true);
  });
});

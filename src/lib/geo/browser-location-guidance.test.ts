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
    expect(guidance.retryLabel).toBe("설정 후 새로고침");
    expect(guidance.retryAction).toBe("reload");
    expect(guidance.manualSearchAvailable).toBe(false);
  });

  it("prioritizes opening an external browser for embedded browsers", () => {
    const guidance = getBrowserLocationGuidance({
      error: new BrowserLocationError("GEOLOCATION_PERMISSION_DENIED"),
      userAgent: "Mozilla/5.0 Android KAKAOTALK/25.1.0",
    });

    expect(guidance.steps[0]).toContain("Chrome으로 열기");
    expect(guidance.retryLabel).toBe("Chrome에서 열기");
    expect(guidance.retryAction).toBe("external-browser");
    expect(guidance.primaryAction).toBe("retry");
  });

  it("asks for one retry when coordinates are wider than 500 meters", () => {
    const guidance = getBrowserLocationGuidance({
      accuracyMeters: 850,
      userAgent: "Mozilla/5.0 Android",
    });

    expect(guidance.title).toBe("위치 오차 범위가 넓은 상태입니다.");
    expect(guidance.retryAvailable).toBe(true);
    expect(guidance.manualSearchAvailable).toBe(false);
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

  it("stops offering sensor retries after one transient failure retry", () => {
    const firstGuidance = getBrowserLocationGuidance({
      error: new BrowserLocationError("GEOLOCATION_TIMEOUT"),
    });
    const fallbackGuidance = getBrowserLocationGuidance({
      error: new BrowserLocationError("GEOLOCATION_TIMEOUT"),
      transientRetryCompleted: true,
    });

    expect(firstGuidance.retryAction).toBe("fresh-location");
    expect(firstGuidance.primaryAction).toBe("retry");
    expect(firstGuidance.manualSearchAvailable).toBe(false);
    expect(fallbackGuidance.retryAvailable).toBe(false);
    expect(fallbackGuidance.manualSearchAvailable).toBe(true);
    expect(fallbackGuidance.primaryAction).toBe("manual");
  });

  it("retries only administrative resolution when coordinates already exist", () => {
    const firstGuidance = getBrowserLocationGuidance({
      coordinatesAvailable: true,
      error: new Error("Kakao request failed"),
      permissionMode: "granted",
    });
    const fallbackGuidance = getBrowserLocationGuidance({
      coordinatesAvailable: true,
      error: new Error("Kakao request failed"),
      permissionMode: "granted",
      transientRetryCompleted: true,
    });

    expect(firstGuidance.retryLabel).toBe("동네 정보 다시 불러오기");
    expect(firstGuidance.retryAction).toBe("resolve-location");
    expect(firstGuidance.manualSearchAvailable).toBe(false);
    expect(fallbackGuidance.retryAvailable).toBe(false);
    expect(fallbackGuidance.primaryAction).toBe("manual");
  });

  it("uses direct recovery actions for structural browser failures", () => {
    const insecureGuidance = getBrowserLocationGuidance({
      error: new BrowserLocationError("GEOLOCATION_INSECURE_CONTEXT"),
    });
    const policyGuidance = getBrowserLocationGuidance({
      error: new BrowserLocationError("GEOLOCATION_POLICY_BLOCKED"),
    });

    expect(insecureGuidance.retryAction).toBe("secure-page");
    expect(policyGuidance.retryAction).toBe("new-window");
  });

  it("reveals manual search only after structural recovery was attempted", () => {
    const firstGuidance = getBrowserLocationGuidance({
      error: new BrowserLocationError("GEOLOCATION_PERMISSION_DENIED"),
    });
    const fallbackGuidance = getBrowserLocationGuidance({
      error: new BrowserLocationError("GEOLOCATION_PERMISSION_DENIED"),
      recoveryAttemptCompleted: true,
    });

    expect(firstGuidance.retryAvailable).toBe(true);
    expect(firstGuidance.manualSearchAvailable).toBe(false);
    expect(fallbackGuidance.retryAvailable).toBe(false);
    expect(fallbackGuidance.manualSearchAvailable).toBe(true);
    expect(fallbackGuidance.primaryAction).toBe("manual");
  });
});

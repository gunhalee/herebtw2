import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAccurateBrowserCoordinates,
  getCurrentBrowserCoordinates,
} from "./browser-location";
import {
  getBrowserGeolocationPermissionState,
  getBrowserLocationFailureCode,
} from "./browser-location-support";

function createPosition(accuracy: number): GeolocationPosition {
  return {
    coords: {
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: 37.5665,
      longitude: 126.978,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
  };
}

describe("accurate browser location acquisition", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps watching until the target accuracy is reached", async () => {
    const clearWatch = vi.fn();
    const watchPosition = vi.fn(
      (success: PositionCallback): number => {
        queueMicrotask(() => {
          success(createPosition(350));
          success(createPosition(75));
        });
        return 7;
      },
    );
    vi.stubGlobal("navigator", {
      geolocation: {
        clearWatch,
        getCurrentPosition: vi.fn(),
        watchPosition,
      },
    });
    vi.stubGlobal("window", {});

    await expect(
      getAccurateBrowserCoordinates({ targetAccuracyMeters: 100 }),
    ).resolves.toMatchObject({ accuracy: 75 });
    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  it("clears the native watch when the request is aborted", async () => {
    const clearWatch = vi.fn();
    vi.stubGlobal("navigator", {
      geolocation: {
        clearWatch,
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn(() => 11),
      },
    });
    vi.stubGlobal("window", {});
    const controller = new AbortController();
    const result = getAccurateBrowserCoordinates({
      signal: controller.signal,
    });

    controller.abort();

    await expect(result).rejects.toThrow("GEOLOCATION_ABORTED");
    expect(clearWatch).toHaveBeenCalledWith(11);
  });

  it("returns the best available fix after the improvement window", async () => {
    vi.useFakeTimers();
    const clearWatch = vi.fn();
    vi.stubGlobal("navigator", {
      geolocation: {
        clearWatch,
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn((success: PositionCallback) => {
          queueMicrotask(() => success(createPosition(240)));
          return 23;
        }),
      },
    });
    vi.stubGlobal("window", { isSecureContext: true });

    const result = getAccurateBrowserCoordinates({
      improvementWaitMs: 1000,
      maxWaitMs: 5000,
      targetAccuracyMeters: 100,
    });
    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toMatchObject({ accuracy: 240 });
    expect(clearWatch).toHaveBeenCalledWith(23);
  });

  it("reports an explicit error when an embedding policy blocks location", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn(),
      },
    });
    vi.stubGlobal("document", {
      permissionsPolicy: {
        allowsFeature: vi.fn(() => false),
      },
    });
    vi.stubGlobal("window", { isSecureContext: true });

    const error = await getCurrentBrowserCoordinates().catch((reason) => reason);

    expect(getBrowserLocationFailureCode(error)).toBe(
      "GEOLOCATION_POLICY_BLOCKED",
    );
  });

  it("normalizes synchronous WebView security failures", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn(() => {
          throw new DOMException("Denied by host", "SecurityError");
        }),
      },
    });
    vi.stubGlobal("window", { isSecureContext: true });

    const error = await getCurrentBrowserCoordinates().catch((reason) => reason);

    expect(getBrowserLocationFailureCode(error)).toBe(
      "GEOLOCATION_PERMISSION_DENIED",
    );
  });

  it("uses getCurrentPosition when watchPosition is missing", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      queueMicrotask(() => success(createPosition(120)));
    });
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition },
    });
    vi.stubGlobal("window", { isSecureContext: true });

    await expect(getAccurateBrowserCoordinates()).resolves.toMatchObject({
      accuracy: 120,
    });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("treats the Permissions API as optional", async () => {
    vi.stubGlobal("navigator", { geolocation: {} });

    await expect(getBrowserGeolocationPermissionState()).resolves.toBe(
      "unsupported",
    );
  });
});

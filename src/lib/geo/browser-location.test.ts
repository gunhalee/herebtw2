import { afterEach, describe, expect, it, vi } from "vitest";
import { getAccurateBrowserCoordinates } from "./browser-location";

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
      geolocation: { clearWatch, watchPosition },
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
});

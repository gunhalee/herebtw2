import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccurate: vi.fn(),
  getCurrent: vi.fn(),
  getPermission: vi.fn(),
  resolve: vi.fn(),
}));

vi.mock("./browser-location", () => ({
  getAccurateBrowserCoordinates: mocks.getAccurate,
  getCurrentBrowserCoordinates: mocks.getCurrent,
}));

vi.mock("./browser-location-support", () => ({
  getBrowserGeolocationPermissionState: mocks.getPermission,
}));

vi.mock("./browser-administrative-location", () => ({
  readCachedAdministrativeLocation: vi.fn(() => null),
  writeCachedAdministrativeLocation: vi.fn(),
}));

vi.mock("./browser-administrative-location-resolver", () => ({
  getBrowserLocationPermissionMode: vi.fn(() => "unknown"),
  resolveAdministrativeLocation: mocks.resolve,
}));

describe("browser location session concurrency", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", {});
    mocks.getAccurate.mockReset();
    mocks.getCurrent.mockReset();
    mocks.getPermission.mockReset();
    mocks.getPermission.mockResolvedValue("prompt");
    mocks.resolve.mockReset();
    mocks.resolve.mockResolvedValue({
      administrativeDongCode: "1111051500",
      administrativeDongName: "청운효자동",
      countryCode: "kr",
      formattedAdministrativeAreaName: "서울특별시 종로구 청운효자동",
      latitude: 37.5665,
      longitude: 126.978,
      locationResolutionToken: "token-v2",
      locationResolutionTokenExpiresAt: Date.now() + 600000,
      sidoName: "서울특별시",
      sigunguName: "종로구",
    });
  });

  it("lets a compose request supersede a pending home request", async () => {
    let homeAborted = false;
    mocks.getCurrent.mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            homeAborted = true;
            reject(new Error("GEOLOCATION_ABORTED"));
          });
        }),
    );
    mocks.getAccurate.mockResolvedValue({
      accuracy: 45,
      latitude: 37.5665,
      longitude: 126.978,
      measuredAt: Date.now(),
    });

    const session = await import("./browser-location-session");
    const homeRequest = session.refreshBrowserLocationSession();
    const composeResult = await session.refreshFreshBrowserLocationSession();

    expect(homeAborted).toBe(true);
    expect(composeResult).toMatchObject({
      accuracyMeters: 45,
      phase: "administrative_verified",
      resolvedLocation: {
        locationResolutionToken: "token-v2",
      },
    });
    await expect(homeRequest).resolves.not.toMatchObject({
      phase: "error",
    });
    await expect(session.ensureBrowserLocationSession()).resolves.toMatchObject({
      phase: "administrative_verified",
      resolvedLocation: {
        locationResolutionToken: "token-v2",
      },
    });
  });

  it("deduplicates repeated compose requests", async () => {
    let releaseMeasurement!: () => void;
    mocks.getAccurate.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseMeasurement = () =>
            resolve({
              accuracy: 60,
              latitude: 37.5665,
              longitude: 126.978,
              measuredAt: Date.now(),
            });
        }),
    );

    const session = await import("./browser-location-session");
    const first = session.refreshFreshBrowserLocationSession();
    const second = session.refreshFreshBrowserLocationSession();

    expect(mocks.getAccurate).toHaveBeenCalledTimes(1);
    releaseMeasurement();
    await Promise.all([first, second]);
    expect(mocks.resolve).toHaveBeenCalledTimes(1);
  });

  it("does not trigger the browser prompt while preparing a first visit", async () => {
    const session = await import("./browser-location-session");

    await expect(session.prepareBrowserLocationSession()).resolves.toMatchObject({
      permissionMode: "prompt",
      phase: "idle",
    });
    expect(mocks.getCurrent).not.toHaveBeenCalled();
    expect(mocks.getAccurate).not.toHaveBeenCalled();
  });
});

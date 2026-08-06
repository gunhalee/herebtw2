import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readCachedAdministrativeLocation,
  writeCachedAdministrativeLocation,
} from "./browser-administrative-location";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const LOCATION = { latitude: 37.5665, longitude: 126.978 };

describe("browser administrative location cache v2", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: new MemoryStorage(),
    });
  });

  it("reuses only the same 20m lookup cell", () => {
    writeCachedAdministrativeLocation(LOCATION, {
      administrativeDongCode: "1111051500",
      administrativeDongName: "청운효자동",
      formattedAdministrativeAreaName: "서울특별시 종로구 청운효자동",
      locationResolutionToken: "token",
      locationResolutionTokenExpiresAt: Date.now() + 60000,
    });

    expect(readCachedAdministrativeLocation(LOCATION)).toMatchObject({
      administrativeDongCode: "1111051500",
      formattedAdministrativeAreaName: "서울특별시 종로구 청운효자동",
      locationResolutionToken: "token",
    });
    expect(
      readCachedAdministrativeLocation({
        latitude: LOCATION.latitude + 0.00027,
        longitude: LOCATION.longitude,
      }),
    ).toBeNull();
  });

  it("drops expired resolution tokens but keeps display metadata", () => {
    writeCachedAdministrativeLocation(LOCATION, {
      administrativeDongCode: "1111051500",
      administrativeDongName: "청운효자동",
      formattedAdministrativeAreaName: "서울특별시 종로구 청운효자동",
      locationResolutionToken: "expired",
      locationResolutionTokenExpiresAt: Date.now() - 1,
    });

    expect(readCachedAdministrativeLocation(LOCATION)).toMatchObject({
      locationResolutionToken: null,
      locationResolutionTokenExpiresAt: null,
    });
  });
});

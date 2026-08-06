import { describe, expect, it, vi } from "vitest";

vi.mock("./reverse-geocode", () => ({
  reverseGeocode: vi.fn().mockResolvedValue({
    administrativeDongCode: "1111051500",
    administrativeDongName: "청운효자동",
    countryCode: "kr",
    sidoName: "서울특별시",
    sigunguName: "종로구",
  }),
}));

import {
  isWithinSouthKoreaServiceBounds,
  resolveLocationFromCoordinates,
} from "./resolve-location";

describe("location service boundary", () => {
  it("accepts South Korean coordinates", () => {
    expect(
      isWithinSouthKoreaServiceBounds({
        latitude: 37.5665,
        longitude: 126.978,
      }),
    ).toBe(true);
  });

  it("rejects coordinates outside the service area before lookup", async () => {
    await expect(
      resolveLocationFromCoordinates({
        latitude: 35.6762,
        longitude: 139.6503,
      }),
    ).rejects.toMatchObject({ code: "OUTSIDE_SERVICE_AREA" });
  });
});

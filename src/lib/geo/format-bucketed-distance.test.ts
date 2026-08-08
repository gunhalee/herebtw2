import { describe, expect, it } from "vitest";
import {
  DISTANCE_UNAVAILABLE_SENTINEL_METERS,
  formatBucketedDistance,
  getAdministrativeAreaDistanceForDisplay,
} from "./format-bucketed-distance";

describe("administrative area distance display", () => {
  it("keeps distances for dong, eup, and myeon posts", () => {
    expect(
      getAdministrativeAreaDistanceForDisplay("서울 성동구 성수1가1동", 320),
    ).toBe(320);
    expect(
      getAdministrativeAreaDistanceForDisplay("제주 제주시 애월읍", 1200),
    ).toBe(1200);
    expect(
      getAdministrativeAreaDistanceForDisplay("강원 인제군 북면", 900),
    ).toBe(900);
  });

  it("does not present a region centroid as the writer's distance", () => {
    expect(
      getAdministrativeAreaDistanceForDisplay("서울 강남구", 320),
    ).toBe(DISTANCE_UNAVAILABLE_SENTINEL_METERS);
    expect(getAdministrativeAreaDistanceForDisplay("서울", 320)).toBe(
      DISTANCE_UNAVAILABLE_SENTINEL_METERS,
    );
    expect(formatBucketedDistance(DISTANCE_UNAVAILABLE_SENTINEL_METERS)).toBe(
      "거리 미확인",
    );
  });
});

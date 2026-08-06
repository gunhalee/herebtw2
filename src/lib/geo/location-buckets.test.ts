import { describe, expect, it } from "vitest";
import {
  dequantizeLocationFrom20MeterGridBuckets,
  quantizeLocationTo20MeterGrid,
  quantizeLocationTo100MeterGrid,
} from "./location-buckets";

describe("location buckets", () => {
  it("keeps lookup and storage grids independent", () => {
    const first = { latitude: 37.5665, longitude: 126.978 };
    const nearby = { latitude: 37.56677, longitude: 126.978 };

    expect(quantizeLocationTo100MeterGrid(nearby)).toEqual(
      quantizeLocationTo100MeterGrid(first),
    );
    expect(quantizeLocationTo20MeterGrid(nearby)).not.toEqual(
      quantizeLocationTo20MeterGrid(first),
    );
  });

  it("dequantizes a lookup cell to its representative coordinate", () => {
    const location = { latitude: 37.5665, longitude: 126.978 };
    const buckets = quantizeLocationTo20MeterGrid(location);
    const restored = dequantizeLocationFrom20MeterGridBuckets(buckets);

    expect(Math.abs(restored.latitude - location.latitude)).toBeLessThan(
      0.0002,
    );
    expect(Math.abs(restored.longitude - location.longitude)).toBeLessThan(
      0.0002,
    );
  });
});

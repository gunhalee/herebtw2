import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readCachedNearbyPostList,
  writeCachedNearbyPostList,
} from "./browser-nearby-post-cache";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const LOCATION = { latitude: 37.5665, longitude: 126.978 };

describe("nearby post cache isolation", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: new MemoryStorage(),
    });
  });

  it("does not return a feed cached for another 100m cell", () => {
    writeCachedNearbyPostList(
      LOCATION,
      {
        items: [],
        nextCursor: "cursor",
      },
    );

    expect(readCachedNearbyPostList(LOCATION)).toMatchObject({
      nextCursor: "cursor",
    });
    expect(
      readCachedNearbyPostList({
        latitude: LOCATION.latitude + 0.0012,
        longitude: LOCATION.longitude,
      }),
    ).toBeNull();
  });
});

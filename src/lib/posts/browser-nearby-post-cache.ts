import type { PostListState, PostLocation } from "../../types/post";
import { quantizeLocationTo100MeterGrid } from "../geo/location-buckets";

const NEARBY_POST_CACHE_STORAGE_KEY = "herebtw.cachedNearbyPosts";
const NEARBY_POST_CACHE_TTL_MS = 1000 * 60 * 3;

type CachedNearbyPostList = {
  cacheKey: string;
  cachedAt: number;
  items: PostListState["items"];
  nextCursor: string | null;
};

function getNearbyPostCacheKey(location: PostLocation) {
  const quantizedLocation = quantizeLocationTo100MeterGrid(location);

  return [
    quantizedLocation.latitudeBucket100m,
    quantizedLocation.longitudeBucket100m,
  ].join(":");
}

export function readCachedNearbyPostList(
  location: PostLocation,
): Pick<PostListState, "items" | "nextCursor"> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(NEARBY_POST_CACHE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const cached = JSON.parse(raw) as Partial<CachedNearbyPostList>;

    if (
      cached.cacheKey !== getNearbyPostCacheKey(location) ||
      typeof cached.cachedAt !== "number" ||
      Date.now() - cached.cachedAt > NEARBY_POST_CACHE_TTL_MS ||
      !Array.isArray(cached.items)
    ) {
      return null;
    }

    return {
      items: cached.items as PostListState["items"],
      nextCursor:
        typeof cached.nextCursor === "string" || cached.nextCursor === null
          ? cached.nextCursor
          : null,
    };
  } catch {
    return null;
  }
}

export function writeCachedNearbyPostList(
  location: PostLocation,
  state: Pick<PostListState, "items" | "nextCursor">,
) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: CachedNearbyPostList = {
    cacheKey: getNearbyPostCacheKey(location),
    cachedAt: Date.now(),
    items: state.items,
    nextCursor: state.nextCursor,
  };

  window.localStorage.setItem(
    NEARBY_POST_CACHE_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

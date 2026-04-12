import type { PostRow } from "./types";
import { FEED_RPC_DISTANCE_FALLBACK_METERS, isUuid } from "./shared";
import type {
  GlobalPostListCursor,
  NearbyPostRow,
  PostListCursor,
} from "./types";

function encodePostListCursor(post: NearbyPostRow) {
  const payload: PostListCursor = {
    distanceMeters: post.distance_meters,
    createdAt: post.created_at,
    postId: post.id,
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePostListCursor(cursor: string | undefined) {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as Partial<PostListCursor>;

    if (
      typeof payload.distanceMeters !== "number" ||
      !Number.isFinite(payload.distanceMeters) ||
      typeof payload.createdAt !== "string" ||
      !payload.createdAt ||
      typeof payload.postId !== "string" ||
      !isUuid(payload.postId)
    ) {
      return null;
    }

    return payload as PostListCursor;
  } catch {
    return null;
  }
}

function encodeGlobalPostListCursor(post: Pick<PostRow, "id" | "created_at">) {
  const payload: GlobalPostListCursor = {
    createdAt: post.created_at,
    postId: post.id,
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeGlobalPostListCursor(cursor: string | undefined) {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as Partial<GlobalPostListCursor>;

    if (
      typeof payload.createdAt !== "string" ||
      !payload.createdAt ||
      typeof payload.postId !== "string" ||
      !isUuid(payload.postId)
    ) {
      return null;
    }

    return payload as GlobalPostListCursor;
  } catch {
    return null;
  }
}

function getNextNearbyFeedCursor(posts: NearbyPostRow[], hasMore: boolean) {
  if (!hasMore || posts.length === 0) {
    return null;
  }

  return encodePostListCursor(posts[posts.length - 1]!);
}

function getNextGlobalFeedCursor(
  posts: Array<Pick<PostRow, "id" | "created_at">>,
  hasMore: boolean,
) {
  if (!hasMore || posts.length === 0) {
    return null;
  }

  return encodeGlobalPostListCursor(posts[posts.length - 1]!);
}

function normalizeGlobalFeedCursor(cursor: string | undefined) {
  return (
    decodePostListCursor(cursor) ??
    (() => {
      const legacyCursor = decodeGlobalPostListCursor(cursor);

      if (!legacyCursor) {
        return null;
      }

      return {
        distanceMeters: FEED_RPC_DISTANCE_FALLBACK_METERS,
        createdAt: legacyCursor.createdAt,
        postId: legacyCursor.postId,
      } satisfies PostListCursor;
    })()
  );
}

function resolveLegacyGlobalCursor(
  rawCursor: string | undefined,
  cursor: PostListCursor | null,
) {
  return (
    decodeGlobalPostListCursor(rawCursor) ??
    (cursor
      ? {
          createdAt: cursor.createdAt,
          postId: cursor.postId,
        }
      : null)
  );
}

export {
  decodePostListCursor,
  getNextGlobalFeedCursor,
  getNextNearbyFeedCursor,
  normalizeGlobalFeedCursor,
  resolveLegacyGlobalCursor,
};

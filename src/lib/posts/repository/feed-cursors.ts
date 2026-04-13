import { isUuid } from "./shared";
import type { NearbyPostRow, PostListCursor } from "./types";

function encodePostListCursor(post: NearbyPostRow) {
  const payload: PostListCursor = {
    priorityGroup:
      typeof post.priority_group === "number" && Number.isFinite(post.priority_group)
        ? post.priority_group
        : 0,
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
      typeof payload.priorityGroup !== "number" ||
      !Number.isFinite(payload.priorityGroup) ||
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

function getNextNearbyFeedCursor(posts: NearbyPostRow[], hasMore: boolean) {
  if (!hasMore || posts.length === 0) {
    return null;
  }

  return encodePostListCursor(posts[posts.length - 1]!);
}

export {
  decodePostListCursor,
  getNextNearbyFeedCursor,
};

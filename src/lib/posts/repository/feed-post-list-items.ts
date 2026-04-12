import type { PostListState, PostLocation } from "../../../types/post";
import { formatRelativeTime } from "../../utils/datetime";
import type {
  NearbyPostRow,
  PostEngagementRow,
  PostRow,
  ReactionRow,
} from "./types";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function hasStoredCoordinates(post: Pick<PostRow, "latitude" | "longitude">) {
  return (
    typeof post.latitude === "number" &&
    Number.isFinite(post.latitude) &&
    typeof post.longitude === "number" &&
    Number.isFinite(post.longitude)
  );
}

function calculateDistanceMeters(from: PostLocation, to: PostLocation) {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(
    2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

function estimateDistanceMeters(
  post: Pick<PostRow, "latitude" | "longitude">,
  viewerLocation?: PostLocation,
) {
  if (!viewerLocation || !hasStoredCoordinates(post)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return calculateDistanceMeters(viewerLocation, {
    latitude: post.latitude!,
    longitude: post.longitude!,
  });
}

function getPostDistanceMeters(
  post: Pick<PostRow, "latitude" | "longitude"> & {
    distance_meters?: number | null;
  },
  viewerLocation?: PostLocation,
) {
  if (typeof post.distance_meters === "number" && Number.isFinite(post.distance_meters)) {
    return post.distance_meters;
  }

  return estimateDistanceMeters(post, viewerLocation);
}

function buildPostListItems(
  posts: Array<
    Pick<PostRow, "id" | "content" | "administrative_dong_name" | "created_at" | "latitude" | "longitude"> & {
      distance_meters?: number | null;
    }
  >,
  options?: {
    viewerLocation?: PostLocation;
    engagementRows?: PostEngagementRow[];
    myReactionRows?: ReactionRow[];
    canReport?: boolean;
    distanceMetersOverride?: number;
  },
) {
  const engagementMap = new Map(
    (options?.engagementRows ?? []).map((row) => [row.post_id, Number(row.agree_count)]),
  );
  const myReactionSet = new Set(
    (options?.myReactionRows ?? []).map((row) => row.post_id),
  );

  return posts.map((post) => ({
    id: post.id,
    content: post.content,
    administrativeDongName: post.administrative_dong_name,
    distanceMeters:
      options?.distanceMetersOverride ??
      getPostDistanceMeters(post, options?.viewerLocation),
    relativeTime: formatRelativeTime(post.created_at),
    agreeCount: engagementMap.get(post.id) ?? 0,
    myAgree: myReactionSet.has(post.id),
    canReport: options?.canReport ?? true,
    isHighlighted: false,
  })) satisfies PostListState["items"];
}

function buildRpcPostListItems(
  posts: NearbyPostRow[],
  options?: {
    myAgree?: boolean;
    canReport?: boolean;
    fallbackCanReport?: boolean;
    distanceMetersOverride?: number;
  },
) {
  return posts.map((post) => ({
    id: post.id,
    content: post.content,
    administrativeDongName: post.administrative_dong_name,
    distanceMeters: options?.distanceMetersOverride ?? post.distance_meters,
    relativeTime: formatRelativeTime(post.created_at),
    agreeCount: post.agree_count ?? 0,
    myAgree: options?.myAgree ?? post.my_agree ?? false,
    canReport:
      options?.canReport ??
      post.can_report ??
      options?.fallbackCanReport ??
      true,
    isHighlighted: false,
    replyStatus:
      post.reply_status === "replied"
        ? ("replied" as const)
        : post.reply_status === "delivered"
          ? ("delivered" as const)
          : undefined,
    replyCandidateName: post.reply_candidate_name ?? null,
    replyCandidatePhotoUrl: post.reply_candidate_photo_url ?? null,
    replyCandidateLocalCouncilDistrict:
      post.reply_candidate_local_council_district ?? null,
    replyCandidateCouncilType: post.reply_candidate_council_type ?? null,
    replyContent: post.reply_content ?? null,
    replyIsPromise: post.reply_is_promise ?? null,
  })) satisfies PostListState["items"];
}

export { buildPostListItems, buildRpcPostListItems };

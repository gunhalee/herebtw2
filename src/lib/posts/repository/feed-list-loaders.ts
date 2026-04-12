import type { PostListState, PostLocation } from "../../../types/post";
import { GLOBAL_FEED_DISTANCE_SENTINEL_METERS } from "../../geo/location-buckets";
import { supabaseRpc, supabaseSelect } from "../../supabase/rest";
import {
  buildPostListItems,
  buildRpcPostListItems,
  createPostListState,
  getNextGlobalFeedCursor,
  getNextNearbyFeedCursor,
  logLoadedFeedMetrics,
  resolveLegacyGlobalCursor,
  sliceFeedRows,
  sliceNearbyRpcRows,
} from "./feed-helpers";
import type {
  FeedMetricsContext,
  PreparedFeedLoadResult,
} from "./feed-preparation";
import {
  loadEngagementRows,
  loadMyAgreeRows,
  loadMyReportRows,
} from "./feed-snapshot";
import { ensureDeviceIdentity, getElapsedTimeMs } from "./shared";
import type { NearbyPostRow, PostRow } from "./types";

function createLoggedPostListState(input: {
  metricsContext: FeedMetricsContext;
  path: "rpc" | "legacy";
  items: PostListState["items"];
  hasMore: boolean;
  rpcDurationMs: number;
  startedAtMs: number;
  sort: PostListState["sort"];
  nextCursor: string | null;
}) {
  logLoadedFeedMetrics({
    metricsContext: input.metricsContext,
    path: input.path,
    itemCount: input.items.length,
    hasMore: input.hasMore,
    rpcDurationMs: input.rpcDurationMs,
    totalDurationMs: getElapsedTimeMs(input.startedAtMs),
  });

  return createPostListState({
    items: input.items,
    nextCursor: input.nextCursor,
    sort: input.sort,
  });
}

function buildNearbyRpcPostListState(input: {
  preparedLoad: PreparedFeedLoadResult;
  anonymousDeviceId?: string;
  sort: PostListState["sort"];
}) {
  const rpcRows = input.preparedLoad.rpcResult.rows;

  if (!rpcRows || input.preparedLoad.fallbackReason) {
    return null;
  }

  const { hasMore, selectedRows } = sliceNearbyRpcRows(
    rpcRows,
    input.preparedLoad.limit,
    Boolean(input.anonymousDeviceId),
  );
  const items = buildRpcPostListItems(selectedRows, {
    fallbackCanReport: Boolean(input.anonymousDeviceId),
  });

  return createLoggedPostListState({
    metricsContext: input.preparedLoad.metricsContext,
    path: "rpc",
    items,
    hasMore,
    rpcDurationMs: input.preparedLoad.rpcResult.durationMs,
    startedAtMs: input.preparedLoad.startedAtMs,
    sort: input.sort,
    nextCursor: getNextNearbyFeedCursor(selectedRows, hasMore),
  });
}

async function loadLegacyNearbyPostListState(input: {
  preparedLoad: PreparedFeedLoadResult;
  anonymousDeviceId?: string;
  location?: PostLocation;
  sort: PostListState["sort"];
}) {
  const device = input.anonymousDeviceId
    ? await ensureDeviceIdentity(input.anonymousDeviceId)
    : null;
  const posts =
    (await supabaseRpc<NearbyPostRow[]>("list_nearby_posts", {
      viewer_latitude: input.location?.latitude ?? null,
      viewer_longitude: input.location?.longitude ?? null,
      cursor_distance_meters: input.preparedLoad.cursor?.distanceMeters ?? null,
      cursor_created_at: input.preparedLoad.cursor?.createdAt ?? null,
      cursor_post_id: input.preparedLoad.cursor?.postId ?? null,
      result_limit: input.preparedLoad.limit + 1,
    })) ?? [];
  const { hasMore, selectedRows } = sliceFeedRows(
    posts,
    input.preparedLoad.limit,
  );
  const postIds = selectedRows.map((post) => post.id);
  const [engagementRows, myReactionRows, myReportRows] = await Promise.all([
    loadEngagementRows(postIds),
    loadMyAgreeRows(device?.id, postIds),
    loadMyReportRows(device?.id, postIds),
  ]);
  const reportedPostIdSet = new Set(myReportRows.map((row) => row.post_id));
  const visiblePosts = selectedRows.filter((post) => !reportedPostIdSet.has(post.id));
  const visiblePostIdSet = new Set(visiblePosts.map((post) => post.id));
  const items = buildPostListItems(visiblePosts, {
    viewerLocation: input.location,
    engagementRows: engagementRows.filter((row) => visiblePostIdSet.has(row.post_id)),
    myReactionRows: myReactionRows.filter((row) => visiblePostIdSet.has(row.post_id)),
  });

  return createLoggedPostListState({
    metricsContext: input.preparedLoad.metricsContext,
    path: "legacy",
    items,
    hasMore,
    rpcDurationMs: input.preparedLoad.rpcResult.durationMs,
    startedAtMs: input.preparedLoad.startedAtMs,
    sort: input.sort,
    nextCursor: getNextNearbyFeedCursor(selectedRows, hasMore),
  });
}

function buildGlobalRpcPostListState(input: {
  preparedLoad: PreparedFeedLoadResult;
}) {
  const rpcRows = input.preparedLoad.rpcResult.rows;

  if (!rpcRows || input.preparedLoad.fallbackReason) {
    return null;
  }

  const { hasMore, selectedRows } = sliceFeedRows(
    rpcRows,
    input.preparedLoad.limit,
  );
  const items = buildRpcPostListItems(selectedRows, {
    myAgree: false,
    canReport: false,
    distanceMetersOverride: GLOBAL_FEED_DISTANCE_SENTINEL_METERS,
  });

  return createLoggedPostListState({
    metricsContext: input.preparedLoad.metricsContext,
    path: "rpc",
    items,
    hasMore,
    rpcDurationMs: input.preparedLoad.rpcResult.durationMs,
    startedAtMs: input.preparedLoad.startedAtMs,
    sort: "latest",
    nextCursor: getNextNearbyFeedCursor(selectedRows, hasMore),
  });
}

async function loadLegacyGlobalPostListState(input: {
  rawCursor: string | undefined;
  preparedLoad: PreparedFeedLoadResult;
}) {
  const legacyCursor = resolveLegacyGlobalCursor(
    input.rawCursor,
    input.preparedLoad.cursor,
  );
  const cursorFilter = legacyCursor
    ? `&or=(created_at.lt.${encodeURIComponent(legacyCursor.createdAt)},and(created_at.eq.${encodeURIComponent(legacyCursor.createdAt)},id.gt.${legacyCursor.postId}))`
    : "";
  const posts =
    (await supabaseSelect<PostRow[]>(
      `posts?select=id,content,administrative_dong_name,created_at,delete_expires_at,latitude,longitude&status=eq.active&latitude=not.is.null&longitude=not.is.null&order=created_at.desc&order=id.asc&limit=${input.preparedLoad.limit + 1}${cursorFilter}`,
    )) ?? [];
  const { hasMore, selectedRows } = sliceFeedRows(
    posts,
    input.preparedLoad.limit,
  );
  const postIds = selectedRows.map((post) => post.id);
  const engagementRows = await loadEngagementRows(postIds);
  const items = buildPostListItems(selectedRows, {
    engagementRows,
    canReport: false,
    distanceMetersOverride: GLOBAL_FEED_DISTANCE_SENTINEL_METERS,
  });

  return createLoggedPostListState({
    metricsContext: input.preparedLoad.metricsContext,
    path: "legacy",
    items,
    hasMore,
    rpcDurationMs: input.preparedLoad.rpcResult.durationMs,
    startedAtMs: input.preparedLoad.startedAtMs,
    sort: "latest",
    nextCursor: getNextGlobalFeedCursor(selectedRows, hasMore),
  });
}

export {
  buildGlobalRpcPostListState,
  buildNearbyRpcPostListState,
  loadLegacyGlobalPostListState,
  loadLegacyNearbyPostListState,
};

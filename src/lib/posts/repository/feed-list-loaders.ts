import type { PostListState } from "../../../types/post";
import { GLOBAL_FEED_DISTANCE_SENTINEL_METERS } from "../../geo/location-buckets";
import {
  buildRpcPostListItems,
  createPostListState,
  getNextNearbyFeedCursor,
  logLoadedFeedMetrics,
  sliceFeedRows,
  sliceNearbyRpcRows,
} from "./feed-helpers";
import type {
  FeedMetricsContext,
  PreparedFeedLoadResult,
} from "./feed-preparation";
import { getElapsedTimeMs } from "./shared";

function createLoggedPostListState(input: {
  metricsContext: FeedMetricsContext;
  items: PostListState["items"];
  hasMore: boolean;
  rpcDurationMs: number;
  startedAtMs: number;
  sort: PostListState["sort"];
  nextCursor: string | null;
}) {
  logLoadedFeedMetrics({
    metricsContext: input.metricsContext,
    path: "rpc",
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
  const { hasMore, selectedRows } = sliceNearbyRpcRows(
    input.preparedLoad.rpcResult.rows,
    input.preparedLoad.limit,
    Boolean(input.anonymousDeviceId),
  );
  const items = buildRpcPostListItems(selectedRows, {
    fallbackCanReport: Boolean(input.anonymousDeviceId),
  });

  return createLoggedPostListState({
    metricsContext: input.preparedLoad.metricsContext,
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
  const { hasMore, selectedRows } = sliceFeedRows(
    input.preparedLoad.rpcResult.rows,
    input.preparedLoad.limit,
  );
  const items = buildRpcPostListItems(selectedRows, {
    myAgree: false,
    canReport: false,
    distanceMetersOverride: GLOBAL_FEED_DISTANCE_SENTINEL_METERS,
  });

  return createLoggedPostListState({
    metricsContext: input.preparedLoad.metricsContext,
    items,
    hasMore,
    rpcDurationMs: input.preparedLoad.rpcResult.durationMs,
    startedAtMs: input.preparedLoad.startedAtMs,
    sort: "latest",
    nextCursor: getNextNearbyFeedCursor(selectedRows, hasMore),
  });
}

export {
  buildGlobalRpcPostListState,
  buildNearbyRpcPostListState,
};

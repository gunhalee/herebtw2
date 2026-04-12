import type { PostLocation } from "../../../types/post";
import { supabaseRpc } from "../../supabase/rest";
import {
  buildFeedMetricsContext,
  clampFeedLimit,
  decodePostListCursor,
  getFeedRpcFallbackReason,
  logFeedMetrics,
  shouldFallbackToLegacyFeedRpc,
  type FeedMetricsContext,
} from "./feed-helpers";
import { getElapsedTimeMs, getMonotonicTimeMs } from "./shared";
import type {
  FeedFallbackReason,
  FeedScope,
  NearbyPostRow,
  PostListCursor,
} from "./types";

async function loadPostsFeedRpc(input: {
  scope: FeedScope;
  anonymousDeviceId?: string;
  limit: number;
  cursor: PostListCursor | null;
  location?: PostLocation;
  viewerLocalCouncilDistrict?: string | null;
  viewerMetroCouncilDistrict?: string | null;
}) {
  const startedAtMs = getMonotonicTimeMs();

  try {
    const rows =
      (await supabaseRpc<NearbyPostRow[]>("list_posts_feed", {
        viewer_latitude: input.location?.latitude ?? null,
        viewer_longitude: input.location?.longitude ?? null,
        viewer_anonymous_device_id: input.anonymousDeviceId ?? null,
        cursor_distance_meters: input.cursor?.distanceMeters ?? null,
        cursor_created_at: input.cursor?.createdAt ?? null,
        cursor_post_id: input.cursor?.postId ?? null,
        result_limit: input.limit + 1,
        viewer_local_council_district: input.viewerLocalCouncilDistrict ?? null,
        viewer_metro_council_district: input.viewerMetroCouncilDistrict ?? null,
      })) ?? [];

    return {
      rows,
      durationMs: getElapsedTimeMs(startedAtMs),
      fallbackReason: null as FeedFallbackReason | null,
    };
  } catch (error) {
    if (shouldFallbackToLegacyFeedRpc(error)) {
      return {
        rows: null,
        durationMs: getElapsedTimeMs(startedAtMs),
        fallbackReason: "missing_rpc" as FeedFallbackReason,
      };
    }

    logFeedMetrics("error", "rpc_failed", {
      ...buildFeedMetricsContext(input),
      rpcDurationMs: getElapsedTimeMs(startedAtMs),
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

type PrepareFeedLoadParams = {
  scope: FeedScope;
  anonymousDeviceId?: string;
  limit?: number;
  cursor?: string;
  location?: PostLocation;
  viewerLocalCouncilDistrict?: string | null;
  viewerMetroCouncilDistrict?: string | null;
  decodeCursor?: (cursor: string | undefined) => PostListCursor | null;
};

async function prepareFeedLoad({
  scope,
  anonymousDeviceId,
  limit: rawLimit,
  cursor: rawCursor,
  location,
  viewerLocalCouncilDistrict,
  viewerMetroCouncilDistrict,
  decodeCursor = decodePostListCursor,
}: PrepareFeedLoadParams) {
  const startedAtMs = getMonotonicTimeMs();
  const limit = clampFeedLimit(rawLimit);
  const cursor = decodeCursor(rawCursor);
  const metricsContext = buildFeedMetricsContext({
    scope,
    anonymousDeviceId,
    cursor,
    limit,
    location,
  });
  const rpcResult = await loadPostsFeedRpc({
    scope,
    anonymousDeviceId,
    limit,
    cursor,
    location,
    viewerLocalCouncilDistrict,
    viewerMetroCouncilDistrict,
  });

  return {
    startedAtMs,
    limit,
    cursor,
    metricsContext,
    rpcResult,
    fallbackReason: getFeedRpcFallbackReason(
      rpcResult.rows,
      rpcResult.fallbackReason,
    ),
  };
}

type PreparedFeedLoadResult = Awaited<ReturnType<typeof prepareFeedLoad>>;

export { prepareFeedLoad };
export type { FeedMetricsContext, PreparedFeedLoadResult, PrepareFeedLoadParams };

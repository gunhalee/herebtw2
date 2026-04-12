import type { PostListState, PostLocation } from "../../../types/post";
import { hasSupabaseServerConfig } from "../../supabase/config";
import { supabaseRpc } from "../../supabase/rest";
import { getMockPostListState } from "../mock-data";
import {
  clampFeedLimit,
  createPostListState,
  logFeedFallbackMetrics,
  normalizeGlobalFeedCursor,
} from "./feed-helpers";
import {
  buildGlobalRpcPostListState,
  buildNearbyRpcPostListState,
  loadLegacyGlobalPostListState,
  loadLegacyNearbyPostListState,
} from "./feed-list-loaders";
import { prepareFeedLoad } from "./feed-preparation";
import { loadPostEngagementSnapshotRepository } from "./feed-snapshot";
import type { PostDetailRow } from "./types";

async function loadPostsListRepository(input: {
  anonymousDeviceId?: string;
  limit?: number;
  cursor?: string;
  location?: PostLocation;
  viewerLocalCouncilDistrict?: string | null;
  viewerMetroCouncilDistrict?: string | null;
}) {
  if (!hasSupabaseServerConfig()) {
    return getMockPostListState();
  }

  const preparedLoad = await prepareFeedLoad({
    scope: "nearby",
    anonymousDeviceId: input.anonymousDeviceId,
    limit: input.limit,
    cursor: input.cursor,
    location: input.location,
    viewerLocalCouncilDistrict: input.viewerLocalCouncilDistrict,
    viewerMetroCouncilDistrict: input.viewerMetroCouncilDistrict,
  });
  const sort: PostListState["sort"] = input.location ? "distance" : "latest";
  const rpcState = buildNearbyRpcPostListState({
    preparedLoad,
    anonymousDeviceId: input.anonymousDeviceId,
    sort,
  });

  if (rpcState) {
    return rpcState;
  }

  if (preparedLoad.fallbackReason) {
    logFeedFallbackMetrics({
      metricsContext: preparedLoad.metricsContext,
      fallbackReason: preparedLoad.fallbackReason,
      rpcDurationMs: preparedLoad.rpcResult.durationMs,
    });
  }

  return loadLegacyNearbyPostListState({
    preparedLoad,
    anonymousDeviceId: input.anonymousDeviceId,
    location: input.location,
    sort,
  });
}

async function syncNearbyFeedRepository(input: {
  anonymousDeviceId?: string;
  loadedPostIds?: string[];
  limit?: number;
  location: PostLocation;
}) {
  const limit = clampFeedLimit(input.limit ?? input.loadedPostIds?.length);
  const snapshot = await loadPostsListRepository({
    anonymousDeviceId: input.anonymousDeviceId,
    limit,
    location: input.location,
  });
  const loadedPostIdSet = new Set(input.loadedPostIds ?? []);

  return {
    items: snapshot.items,
    nextCursor: snapshot.nextCursor,
    newItemsCount: snapshot.items.filter((item) => !loadedPostIdSet.has(item.id))
      .length,
  };
}

async function loadGlobalPostsListRepository(input: {
  limit?: number;
  cursor?: string;
}) {
  if (!hasSupabaseServerConfig()) {
    const mockState = getMockPostListState();

    return createPostListState({
      items: mockState.items,
      nextCursor: mockState.nextCursor,
      sort: "latest" as const,
    });
  }

  const preparedLoad = await prepareFeedLoad({
    scope: "global",
    limit: input.limit,
    cursor: input.cursor,
    decodeCursor: normalizeGlobalFeedCursor,
  });
  const rpcState = buildGlobalRpcPostListState({
    preparedLoad,
  });

  if (rpcState) {
    return rpcState;
  }

  if (preparedLoad.fallbackReason) {
    logFeedFallbackMetrics({
      metricsContext: preparedLoad.metricsContext,
      fallbackReason: preparedLoad.fallbackReason,
      rpcDurationMs: preparedLoad.rpcResult.durationMs,
    });
  }

  return loadLegacyGlobalPostListState({
    rawCursor: input.cursor,
    preparedLoad,
  });
}

async function findPostByUuidRepository(uuid: string) {
  if (!hasSupabaseServerConfig()) {
    return null;
  }

  const rows = await supabaseRpc<PostDetailRow[]>("get_post_by_uuid", {
    target_uuid: uuid,
  });

  return rows?.[0] ?? null;
}

export {
  findPostByUuidRepository,
  loadGlobalPostsListRepository,
  loadPostEngagementSnapshotRepository,
  loadPostsListRepository,
  syncNearbyFeedRepository,
};

import type { PostLocation } from "../../../types/post";
import { supabaseRpc } from "../../supabase/rest";
import { clampFeedLimit } from "./feed-helpers";
import {
  buildGlobalRpcPostListState,
  buildNearbyRpcPostListState,
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
  const preparedLoad = await prepareFeedLoad({
    scope: "nearby",
    anonymousDeviceId: input.anonymousDeviceId,
    limit: input.limit,
    cursor: input.cursor,
    location: input.location,
    viewerLocalCouncilDistrict: input.viewerLocalCouncilDistrict,
    viewerMetroCouncilDistrict: input.viewerMetroCouncilDistrict,
  });
  const sort = input.location ? "distance" : "latest";

  return buildNearbyRpcPostListState({
    preparedLoad,
    anonymousDeviceId: input.anonymousDeviceId,
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
  const preparedLoad = await prepareFeedLoad({
    scope: "global",
    limit: input.limit,
    cursor: input.cursor,
  });

  return buildGlobalRpcPostListState({
    preparedLoad,
  });
}

async function findPostByUuidRepository(uuid: string) {
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

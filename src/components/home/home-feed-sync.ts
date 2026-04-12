import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { writeCachedNearbyPostList } from "../../lib/posts/browser-nearby-post-cache";
import { createPostEngagementSnapshotToken } from "../../lib/posts/engagement-snapshot-token";
import type { AppShellState } from "../../types/device";
import type { PostListState, PostLocation } from "../../types/post";
import {
  fetchNearbyFeedSync,
  fetchPostEngagementSnapshot,
} from "./home-feed-api";
import {
  buildReadyPostListState,
  matchesLoadedPostIdWindow,
  patchPostEngagementItems,
  patchPostListItems,
  type PendingFeedSnapshot,
} from "./home-feed-state";

const NEARBY_SYNC_WINDOW_LIMIT = 12;
const NEARBY_SYNC_MIN_REQUEST_COUNT = 10;
const ENGAGEMENT_SYNC_WINDOW_LIMIT = 12;

type SyncNearbyFeedParams = {
  isCancelled: () => boolean;
  syncInFlightRef: MutableRefObject<boolean>;
  feedLocationRef: MutableRefObject<PostLocation | null>;
  appShellStateRef: MutableRefObject<AppShellState>;
  postListStateRef: MutableRefObject<PostListState>;
  setPostListState: Dispatch<SetStateAction<PostListState>>;
  setPendingFeedSnapshot: Dispatch<SetStateAction<PendingFeedSnapshot | null>>;
};

type SyncPostEngagementParams = {
  isCancelled: () => boolean;
  engagementSyncInFlightRef: MutableRefObject<boolean>;
  appShellStateRef: MutableRefObject<AppShellState>;
  postListStateRef: MutableRefObject<PostListState>;
  agreePendingPostIdsRef: MutableRefObject<string[]>;
  setPostListState: Dispatch<SetStateAction<PostListState>>;
};

export async function syncNearbyHomeFeed({
  isCancelled,
  syncInFlightRef,
  feedLocationRef,
  appShellStateRef,
  postListStateRef,
  setPostListState,
  setPendingFeedSnapshot,
}: SyncNearbyFeedParams) {
  if (
    isCancelled() ||
    syncInFlightRef.current ||
    typeof document === "undefined" ||
    document.hidden
  ) {
    return;
  }

  const latestLocation = feedLocationRef.current;
  const latestAppShellState = appShellStateRef.current;
  const latestPostListState = postListStateRef.current;

  if (
    !latestLocation ||
    latestAppShellState.readOnlyMode ||
    latestPostListState.loading ||
    latestPostListState.loadingMore
  ) {
    return;
  }

  const syncWindowItems = latestPostListState.items.slice(
    0,
    NEARBY_SYNC_WINDOW_LIMIT,
  );
  const loadedPostIds = syncWindowItems.map((item) => item.id);
  const requestedItemCount = Math.max(
    loadedPostIds.length,
    NEARBY_SYNC_MIN_REQUEST_COUNT,
  );

  syncInFlightRef.current = true;

  try {
    const data = await fetchNearbyFeedSync(
      latestLocation,
      loadedPostIds,
      requestedItemCount,
      latestAppShellState.anonymousDeviceId ?? undefined,
    );

    if (isCancelled()) {
      return;
    }

    if (!data) {
      setPendingFeedSnapshot(null);
      return;
    }

    if (
      !matchesLoadedPostIdWindow(postListStateRef.current.items, loadedPostIds)
    ) {
      return;
    }

    setPostListState((current) => ({
      ...current,
      items: patchPostListItems(current.items, data.items),
    }));

    const currentItemCount = postListStateRef.current.items.length;

    if (currentItemCount === 0 && data.items.length > 0) {
      setPendingFeedSnapshot(null);
      setPostListState((current) =>
        buildReadyPostListState(current, {
          items: data.items,
          nextCursor: data.nextCursor,
          sort: "distance",
        }),
      );
      writeCachedNearbyPostList(latestLocation, {
        items: data.items,
        nextCursor: data.nextCursor,
      });
      return;
    }

    if (
      data.newItemsCount > 0 &&
      matchesLoadedPostIdWindow(postListStateRef.current.items, loadedPostIds)
    ) {
      setPendingFeedSnapshot({
        items: data.items,
        nextCursor: data.nextCursor,
        newItemsCount: data.newItemsCount,
        requestedItemCount,
      });
      return;
    }

    setPendingFeedSnapshot(null);
  } finally {
    syncInFlightRef.current = false;
  }
}

export async function syncHomePostEngagement({
  isCancelled,
  engagementSyncInFlightRef,
  appShellStateRef,
  postListStateRef,
  agreePendingPostIdsRef,
  setPostListState,
}: SyncPostEngagementParams) {
  if (
    isCancelled() ||
    engagementSyncInFlightRef.current ||
    typeof document === "undefined" ||
    document.hidden
  ) {
    return;
  }

  const latestAppShellState = appShellStateRef.current;
  const latestPostListState = postListStateRef.current;

  if (
    latestPostListState.loading ||
    latestPostListState.loadingMore ||
    latestPostListState.items.length === 0
  ) {
    return;
  }

  const syncWindowItems = latestPostListState.items.slice(
    0,
    ENGAGEMENT_SYNC_WINDOW_LIMIT,
  );
  const loadedPostIds = syncWindowItems.map((item) => item.id);
  const snapshotToken = createPostEngagementSnapshotToken(syncWindowItems);
  engagementSyncInFlightRef.current = true;

  try {
    const data = await fetchPostEngagementSnapshot(
      loadedPostIds,
      latestAppShellState.anonymousDeviceId ?? undefined,
      snapshotToken,
    );

    if (isCancelled() || !data) {
      return;
    }

    if (
      !matchesLoadedPostIdWindow(postListStateRef.current.items, loadedPostIds)
    ) {
      return;
    }

    setPostListState((current) => ({
      ...current,
      items: patchPostEngagementItems(current.items, data.items, {
        excludedPostIds: new Set(agreePendingPostIdsRef.current),
      }),
    }));
  } finally {
    engagementSyncInFlightRef.current = false;
  }
}

import { startTransition, type Dispatch, type SetStateAction } from "react";
import {
  ensureRegisteredBrowserDevice,
  getOrCreateBrowserAnonymousDeviceId,
} from "../../lib/device/browser-device";
import type { AdministrativeLocationSnapshot } from "../../lib/geo/browser-administrative-location";
import { prepareBrowserLocationSession } from "../../lib/geo/browser-location-session";
import { readCachedNearbyPostList } from "../../lib/posts/browser-nearby-post-cache";
import type { AppShellState } from "../../types/device";
import type { PostListState, PostLocation } from "../../types/post";
import { fetchActiveHomeFeedPage } from "./home-feed-api";
import {
  buildPostListErrorState,
  buildReadyPostListState,
  type PendingFeedSnapshot,
} from "./home-feed-state";

type BootstrapHomeFeedParams = {
  hasInitialGlobalFeed: boolean;
  isCancelled: () => boolean;
  applyDeniedLocationMode: () => void;
  applyResolvedLocationSelection: (
    location: AdministrativeLocationSnapshot,
    coordinates: PostLocation,
  ) => void;
  setAppShellState: Dispatch<SetStateAction<AppShellState>>;
  setFeedSortMode: Dispatch<SetStateAction<"nearby" | "global">>;
  setPostListState: Dispatch<SetStateAction<PostListState>>;
  setPendingFeedSnapshot: Dispatch<SetStateAction<PendingFeedSnapshot | null>>;
};

function releaseReadOnlyMode(
  setAppShellState: Dispatch<SetStateAction<AppShellState>>,
) {
  setAppShellState((current) =>
    current.readOnlyMode
      ? {
          ...current,
          readOnlyMode: false,
        }
      : current,
  );
}

function markDeviceReady(
  setAppShellState: Dispatch<SetStateAction<AppShellState>>,
  anonymousDeviceId: string,
) {
  setAppShellState((current) => {
    if (current.anonymousDeviceId === anonymousDeviceId && current.deviceReady) {
      return current;
    }

    return {
      ...current,
      anonymousDeviceId,
      deviceReady: true,
    };
  });
}

export async function bootstrapHomeFeed({
  hasInitialGlobalFeed,
  isCancelled,
  applyDeniedLocationMode,
  applyResolvedLocationSelection,
  setAppShellState,
  setFeedSortMode,
  setPostListState,
  setPendingFeedSnapshot,
}: BootstrapHomeFeedParams) {
  const anonymousDeviceId = getOrCreateBrowserAnonymousDeviceId();

  if (!anonymousDeviceId) {
    throw new Error("Unable to prepare the browser device.");
  }

  if (isCancelled()) {
    return;
  }

  markDeviceReady(setAppShellState, anonymousDeviceId);
  void ensureRegisteredBrowserDevice().catch(() => undefined);

  const locationSession = await prepareBrowserLocationSession();

  if (isCancelled()) {
    return;
  }

  const resolvedLocation = locationSession.resolvedLocation;
  const resolvedCoordinates =
    locationSession.permissionMode === "granted" && resolvedLocation
      ? locationSession.coordinates
      : null;
  const cachedNearbyPostList = resolvedCoordinates
    ? readCachedNearbyPostList(resolvedCoordinates)
    : null;

  if (cachedNearbyPostList && resolvedLocation && resolvedCoordinates) {
    startTransition(() => {
      applyResolvedLocationSelection(resolvedLocation, resolvedCoordinates);
      setFeedSortMode("nearby");
      setPendingFeedSnapshot(null);
      setPostListState((current) =>
        buildReadyPostListState(current, {
          items: cachedNearbyPostList.items,
          nextCursor: cachedNearbyPostList.nextCursor,
          sort: "distance",
        }),
      );
    });
  }

  const shouldFetchGlobalFeed = !resolvedCoordinates && !hasInitialGlobalFeed;
  const result =
    resolvedCoordinates || shouldFetchGlobalFeed
      ? await fetchActiveHomeFeedPage(resolvedCoordinates ?? null, {
          anonymousDeviceId,
        })
      : null;

  if (isCancelled()) {
    return;
  }

  startTransition(() => {
    if (locationSession.permissionMode === "denied") {
      applyDeniedLocationMode();
    } else if (resolvedCoordinates && resolvedLocation) {
      applyResolvedLocationSelection(resolvedLocation, resolvedCoordinates);
    } else {
      setAppShellState((current) => ({
        ...current,
        permissionMode: locationSession.permissionMode,
        readOnlyMode: false,
        selectedDongCode: null,
        selectedDongName: null,
      }));
    }

    setFeedSortMode(resolvedCoordinates ? "nearby" : "global");

    if (!result) {
      setPostListState((current) =>
        buildReadyPostListState(current, {
          items: current.items,
          nextCursor: current.nextCursor,
          sort: current.sort,
        }),
      );
      return;
    }

    setPendingFeedSnapshot(null);
    setPostListState((current) =>
      buildReadyPostListState(current, {
        items: result.data.items,
        nextCursor: result.data.nextCursor,
        sort: result.postSort,
      }),
    );
  });
}

export function applyBootstrapError(
  setAppShellState: Dispatch<SetStateAction<AppShellState>>,
  setPostListState: Dispatch<SetStateAction<PostListState>>,
  error: unknown,
) {
  releaseReadOnlyMode(setAppShellState);
  setPostListState((current) =>
    current.items.length > 0
      ? buildReadyPostListState(current, {
          items: current.items,
          nextCursor: current.nextCursor,
          sort: current.sort,
        })
      : buildPostListErrorState(
          current,
          error instanceof Error
            ? error.message
            : "Unable to load the feed.",
        ),
  );
}

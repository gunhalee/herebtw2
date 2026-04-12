"use client";

import {
  useState,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import { fetchActiveHomeFeedPage } from "./home-feed-api";
import {
  buildPostListErrorState,
  buildReadyPostListState,
  type PendingFeedSnapshot,
} from "./home-feed-state";
import {
  ensureBrowserLocationCoordinates,
  ensureBrowserLocationResolutionToken,
} from "../../lib/geo/browser-location-session";
import type { AppShellState } from "../../types/device";
import type { PostListState, PostLocation } from "../../types/post";

type UseHomeComposeFlowParams = {
  dataSourceMode: "supabase" | "mock";
  isMountedRef: MutableRefObject<boolean>;
  appShellStateRef: MutableRefObject<AppShellState>;
  feedLocationRef: MutableRefObject<PostLocation | null>;
  locationSessionCoordinates: PostLocation | null;
  setFeedSortMode: Dispatch<SetStateAction<"nearby" | "global">>;
  setPostListState: Dispatch<SetStateAction<PostListState>>;
  setPendingFeedSnapshot: Dispatch<SetStateAction<PendingFeedSnapshot | null>>;
  closeMenu: () => void;
};

export function useHomeComposeFlow({
  dataSourceMode,
  isMountedRef,
  appShellStateRef,
  feedLocationRef,
  locationSessionCoordinates,
  setFeedSortMode,
  setPostListState,
  setPendingFeedSnapshot,
  closeMenu,
}: UseHomeComposeFlowParams) {
  const [composePanelOpen, setComposePanelOpen] = useState(false);
  const [composePermissionDialogOpen, setComposePermissionDialogOpen] =
    useState(false);

  async function handleCompose() {
    closeMenu();
    setComposePermissionDialogOpen(false);
    const composeLocation = feedLocationRef.current ?? locationSessionCoordinates;

    if (!composeLocation) {
      const locationSession = await ensureBrowserLocationCoordinates();

      if (!locationSession.coordinates) {
        if (isMountedRef.current) {
          setComposePermissionDialogOpen(true);
        }

        return;
      }
    }

    if (dataSourceMode === "supabase") {
      void ensureBrowserLocationResolutionToken({
        maxWaitMs: 0,
        triggerRefresh: true,
      }).catch(() => undefined);
    }

    if (isMountedRef.current) {
      setComposePanelOpen(true);
    }
  }

  function handleCloseComposePanel() {
    setComposePanelOpen(false);
  }

  function handleCloseComposePermissionDialog() {
    setComposePermissionDialogOpen(false);
  }

  function handleRetryCompose() {
    setComposePermissionDialogOpen(false);
    void handleCompose();
  }

  async function handleComposeSuccess() {
    setPendingFeedSnapshot(null);

    if (dataSourceMode !== "supabase") {
      return;
    }

    try {
      const latestLocation = feedLocationRef.current;
      const result = await fetchActiveHomeFeedPage(latestLocation, {
        anonymousDeviceId:
          appShellStateRef.current.anonymousDeviceId ?? undefined,
      });

      setFeedSortMode(result.feedSortMode);
      setPostListState((current) =>
        buildReadyPostListState(current, {
          items: result.data.items,
          nextCursor: result.data.nextCursor,
          sort: result.postSort,
        }),
      );
    } catch (error) {
      setPostListState((current) =>
        buildPostListErrorState(
          current,
          error instanceof Error
            ? error.message
            : "등록 후 목록을 새로고침하지 못했습니다.",
        ),
      );
    }
  }

  return {
    composePanelOpen,
    composePermissionDialogOpen,
    handleCloseComposePanel,
    handleCloseComposePermissionDialog,
    handleCompose,
    handleComposeSuccess,
    handleRetryCompose,
  };
}

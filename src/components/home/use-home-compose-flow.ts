"use client";

import {
  useEffect,
  useRef,
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
  abortActiveBrowserLocationRequest,
  isBrowserLocationAccurateForPost,
  refreshFreshBrowserLocationSession,
} from "../../lib/geo/browser-location-session";
import type { AppShellState } from "../../types/device";
import type { PostListState, PostLocation } from "../../types/post";

type UseHomeComposeFlowParams = {
  isMountedRef: MutableRefObject<boolean>;
  appShellStateRef: MutableRefObject<AppShellState>;
  feedLocationRef: MutableRefObject<PostLocation | null>;
  setFeedSortMode: Dispatch<SetStateAction<"nearby" | "global">>;
  setPostListState: Dispatch<SetStateAction<PostListState>>;
  setPendingFeedSnapshot: Dispatch<SetStateAction<PendingFeedSnapshot | null>>;
  closeMenu: () => void;
};

export function useHomeComposeFlow({
  isMountedRef,
  appShellStateRef,
  feedLocationRef,
  setFeedSortMode,
  setPostListState,
  setPendingFeedSnapshot,
  closeMenu,
}: UseHomeComposeFlowParams) {
  const [composePanelOpen, setComposePanelOpen] = useState(false);
  const [composeLocating, setComposeLocating] = useState(false);
  const [composeLocationDialogMessage, setComposeLocationDialogMessage] =
    useState<string | null>(null);
  const composeLocatingRef = useRef(false);

  useEffect(
    () => () => {
      abortActiveBrowserLocationRequest();
    },
    [],
  );

  async function handleCompose() {
    if (composeLocatingRef.current) {
      return;
    }

    composeLocatingRef.current = true;
    setComposeLocating(true);
    closeMenu();
    setComposeLocationDialogMessage(null);
    const locationRequestedAt = Date.now();

    try {
      const locationSession = await refreshFreshBrowserLocationSession();

      if (
        !locationSession.coordinates ||
        !locationSession.lastCoordinatesAt ||
        locationSession.lastCoordinatesAt < locationRequestedAt
      ) {
        if (isMountedRef.current) {
          setComposeLocationDialogMessage(
            locationSession.permissionMode === "denied"
              ? "글을 작성하려면 위치 권한 허용이 필요해요."
              : "현재 위치를 확인할 수 없습니다. 위치 서비스를 켠 뒤 다시 시도해 주세요.",
          );
        }

        return;
      }

      if (!isBrowserLocationAccurateForPost(locationSession)) {
        if (isMountedRef.current) {
          setComposeLocationDialogMessage(
            "정확한 위치를 확인할 수 없습니다. 브라우저의 정확한 위치 권한을 켠 뒤 다시 시도해 주세요.",
          );
        }

        return;
      }

      if (!locationSession.resolvedLocation?.locationResolutionToken) {
        if (isMountedRef.current) {
          setComposeLocationDialogMessage(
            "현재 위치의 행정동을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
        }

        return;
      }

      if (isMountedRef.current) {
        setComposePanelOpen(true);
      }
    } finally {
      composeLocatingRef.current = false;
      if (isMountedRef.current) {
        setComposeLocating(false);
      }
    }
  }

  function handleCloseComposePanel() {
    setComposePanelOpen(false);
  }

  function handleCloseComposePermissionDialog() {
    setComposeLocationDialogMessage(null);
  }

  function handleRetryCompose() {
    setComposeLocationDialogMessage(null);
    void handleCompose();
  }

  async function handleComposeSuccess() {
    setPendingFeedSnapshot(null);

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
    composeLocating,
    composePanelOpen,
    composePermissionDialogOpen: composeLocationDialogMessage !== null,
    composePermissionDialogMessage: composeLocationDialogMessage,
    handleCloseComposePanel,
    handleCloseComposePermissionDialog,
    handleCompose,
    handleComposeSuccess,
    handleRetryCompose,
  };
}

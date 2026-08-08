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
import {
  getBrowserLocationGuidance,
  type BrowserLocationGuidance,
} from "../../lib/geo/browser-location-guidance";
import { LOCATION_POLICY } from "../../lib/geo/location-policy";
import type { AppShellState } from "../../types/device";
import type { PostListState, PostLocation } from "../../types/post";
import type { AdministrativeLocationSnapshot } from "../../lib/geo/browser-administrative-location";
import type { ManualAdministrativeLocationSelection } from "../../lib/geo/administrative-dong-search";

type UseHomeComposeFlowParams = {
  isMountedRef: MutableRefObject<boolean>;
  appShellStateRef: MutableRefObject<AppShellState>;
  feedLocationRef: MutableRefObject<PostLocation | null>;
  applyResolvedLocationSelection: (
    location: AdministrativeLocationSnapshot,
    coordinates: PostLocation,
  ) => void;
  setFeedSortMode: Dispatch<SetStateAction<"nearby" | "global">>;
  setPostListState: Dispatch<SetStateAction<PostListState>>;
  setPendingFeedSnapshot: Dispatch<SetStateAction<PendingFeedSnapshot | null>>;
  closeMenu: () => void;
};

export function useHomeComposeFlow({
  isMountedRef,
  appShellStateRef,
  feedLocationRef,
  applyResolvedLocationSelection,
  setFeedSortMode,
  setPostListState,
  setPendingFeedSnapshot,
  closeMenu,
}: UseHomeComposeFlowParams) {
  const [composePanelOpen, setComposePanelOpen] = useState(false);
  const [composeLocating, setComposeLocating] = useState(false);
  const [composeLocationGuidance, setComposeLocationGuidance] =
    useState<BrowserLocationGuidance | null>(null);
  const [composeMaximumAccuracyMeters, setComposeMaximumAccuracyMeters] =
    useState<number>(LOCATION_POLICY.submitBlockAboveMeters);
  const [manualLocationSelection, setManualLocationSelection] =
    useState<ManualAdministrativeLocationSelection | null>(null);
  const [manualLocationSearchOpen, setManualLocationSearchOpen] =
    useState(false);
  const composeLocatingRef = useRef(false);
  const accuracyRetryPendingRef = useRef(false);

  useEffect(
    () => () => {
      abortActiveBrowserLocationRequest();
    },
    [],
  );

  async function handleCompose(options?: {
    accuracyRetry?: boolean;
    forceDeniedRetry?: boolean;
  }) {
    if (composeLocatingRef.current) {
      return;
    }

    const hasReusableManualLocation = Boolean(
      manualLocationSelection &&
        manualLocationSelection.locationResolutionTokenExpiresAt >
          Date.now() + 20000,
    );

    if (
      appShellStateRef.current.permissionMode === "denied" &&
      !options?.forceDeniedRetry
    ) {
      closeMenu();

      if (hasReusableManualLocation) {
        setComposeLocationGuidance(null);
        setComposePanelOpen(true);
        return;
      }

      if (manualLocationSelection) {
        setManualLocationSelection(null);
      }

      setComposeLocationGuidance(
        getBrowserLocationGuidance({ permissionMode: "denied" }),
      );
      return;
    }

    if (!options) {
      accuracyRetryPendingRef.current = false;
      setComposeMaximumAccuracyMeters(LOCATION_POLICY.submitBlockAboveMeters);
      setManualLocationSelection(null);
    }

    composeLocatingRef.current = true;
    setComposeLocating(true);
    closeMenu();
    setComposeLocationGuidance(null);
    const locationRequestedAt = Date.now();

    try {
      const locationSession = await refreshFreshBrowserLocationSession();

      if (
        !locationSession.coordinates ||
        !locationSession.lastCoordinatesAt ||
        locationSession.lastCoordinatesAt <
          locationRequestedAt - LOCATION_POLICY.maximumMeasurementAgeMs
      ) {
        if (isMountedRef.current) {
          setComposeLocationGuidance(
            getBrowserLocationGuidance({
              error: locationSession.error,
              permissionMode: locationSession.permissionMode,
            }),
          );
        }

        return;
      }

      if (!isBrowserLocationAccurateForPost(locationSession)) {
        if (
          options?.accuracyRetry &&
          isBrowserLocationAccurateForPost(
            locationSession,
            LOCATION_POLICY.submitFallbackMaxMeters,
          )
        ) {
          setComposeMaximumAccuracyMeters(
            LOCATION_POLICY.submitFallbackMaxMeters,
          );
        } else {
          accuracyRetryPendingRef.current = !options?.accuracyRetry;

          if (isMountedRef.current) {
            setComposeLocationGuidance(
              getBrowserLocationGuidance({
                accuracyMeters: locationSession.accuracyMeters,
                accuracyRetryCompleted: Boolean(options?.accuracyRetry),
                permissionMode: locationSession.permissionMode,
              }),
            );
          }

          return;
        }
      } else {
        setComposeMaximumAccuracyMeters(LOCATION_POLICY.submitBlockAboveMeters);
      }

      if (!locationSession.resolvedLocation?.locationResolutionToken) {
        if (isMountedRef.current) {
          setComposeLocationGuidance(
            getBrowserLocationGuidance({
              error: locationSession.error,
              permissionMode: locationSession.permissionMode,
            }),
          );
        }

        return;
      }

      if (isMountedRef.current) {
        applyResolvedLocationSelection(
          locationSession.resolvedLocation,
          locationSession.coordinates,
        );
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
    setComposeMaximumAccuracyMeters(LOCATION_POLICY.submitBlockAboveMeters);
  }

  function handleCloseComposePermissionDialog() {
    setComposeLocationGuidance(null);
  }

  function handleRetryCompose() {
    setComposeLocationGuidance(null);
    const accuracyRetry = accuracyRetryPendingRef.current;
    accuracyRetryPendingRef.current = false;
    void handleCompose({ accuracyRetry, forceDeniedRetry: true });
  }

  function handleOpenManualLocationSearch() {
    accuracyRetryPendingRef.current = false;
    setComposeLocationGuidance(null);
    setManualLocationSearchOpen(true);
  }

  function handleCloseManualLocationSearch() {
    setManualLocationSearchOpen(false);
  }

  function handleSelectManualLocation(
    selection: ManualAdministrativeLocationSelection,
  ) {
    setManualLocationSelection(selection);
    setManualLocationSearchOpen(false);
    setComposePanelOpen(true);
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
    composeMaximumAccuracyMeters,
    composePermissionDialogOpen: composeLocationGuidance !== null,
    composePermissionDialogGuidance: composeLocationGuidance,
    handleCloseComposePanel,
    handleCloseComposePermissionDialog,
    handleCloseManualLocationSearch,
    handleCompose,
    handleComposeSuccess,
    handleOpenManualLocationSearch,
    handleRetryCompose,
    handleSelectManualLocation,
    manualLocationSearchOpen,
    manualLocationSelection,
  };
}

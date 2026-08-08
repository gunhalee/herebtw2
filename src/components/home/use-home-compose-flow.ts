"use client";

import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { PendingFeedSnapshot } from "./home-feed-state";
import { refreshHomeFeedAfterCompose } from "./refresh-home-feed-after-compose";
import {
  abortActiveBrowserLocationRequest,
  isBrowserLocationAccurateForPost,
  refreshBrowserLocationSession,
  refreshFreshBrowserLocationSession,
} from "../../lib/geo/browser-location-session";
import { getBrowserLocationGuidance, type BrowserLocationContinuationAction, type BrowserLocationGuidance } from "../../lib/geo/browser-location-guidance";
import { clearBrowserLocationRecoveryAttempt, getBrowserLocationRecoveryContext, hasBrowserLocationRecoveryAttempt } from "../../lib/geo/browser-location-recovery";
import { LOCATION_POLICY } from "../../lib/geo/location-policy";
import type { AppShellState } from "../../types/device";
import type { PostListState, PostLocation } from "../../types/post";
import type { AdministrativeLocationSnapshot } from "../../lib/geo/browser-administrative-location";
import type { ManualAdministrativeLocationSelection } from "../../lib/geo/administrative-dong-search";
import { canRetryDeniedBrowserGeolocation } from "../../lib/geo/browser-location-support";

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

  useEffect(() => {
    if (getBrowserLocationRecoveryContext() === "compose") {
      void handleCompose({
        forceDeniedRetry: true,
        recoveryAction: "fresh-location",
      });
    }
  }, []);

  async function handleCompose(options?: {
    accuracyRetry?: boolean;
    forceDeniedRetry?: boolean;
    recoveryAction?: BrowserLocationContinuationAction;
    transientRetryCompleted?: boolean;
  }) {
    if (composeLocatingRef.current) {
      return;
    }

    const hasReusableManualLocation = Boolean(
      manualLocationSelection &&
        manualLocationSelection.locationResolutionTokenExpiresAt >
          Date.now() + 20000,
    );
    const recoveryAttemptCompleted = hasBrowserLocationRecoveryAttempt();

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
        getBrowserLocationGuidance({
          permissionMode: "denied",
          recoveryAttemptCompleted,
        }),
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
      const locationSession =
        options?.recoveryAction === "resolve-location"
          ? await refreshBrowserLocationSession()
          : await refreshFreshBrowserLocationSession();

      if (
        !locationSession.coordinates ||
        !locationSession.lastCoordinatesAt ||
        locationSession.lastCoordinatesAt <
          locationRequestedAt - LOCATION_POLICY.maximumMeasurementAgeMs
      ) {
        if (isMountedRef.current) {
          setComposeLocationGuidance(
            getBrowserLocationGuidance({
              coordinatesAvailable: Boolean(locationSession.coordinates),
              error: locationSession.error,
              permissionMode: locationSession.permissionMode,
              recoveryAttemptCompleted,
              transientRetryCompleted: options?.transientRetryCompleted,
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
                coordinatesAvailable: true,
                error: locationSession.error,
                permissionMode: locationSession.permissionMode,
                recoveryAttemptCompleted,
                transientRetryCompleted: options?.transientRetryCompleted,
              }),
          );
        }

        return;
      }

      if (isMountedRef.current) {
        clearBrowserLocationRecoveryAttempt();
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

  async function handleRetryCompose(action: BrowserLocationContinuationAction) {
    if (
      action === "fresh-location" &&
      appShellStateRef.current.permissionMode === "denied" &&
      !(await canRetryDeniedBrowserGeolocation())
    ) {
      setComposeLocationGuidance(
        getBrowserLocationGuidance({
          permissionMode: "denied",
          transientRetryCompleted: true,
        }),
      );
      return;
    }

    setComposeLocationGuidance(null);
    const accuracyRetry = accuracyRetryPendingRef.current;
    accuracyRetryPendingRef.current = false;
    void handleCompose({
      accuracyRetry,
      forceDeniedRetry: true,
      recoveryAction: accuracyRetry ? "fresh-location" : action,
      transientRetryCompleted: !accuracyRetry,
    });
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
    await refreshHomeFeedAfterCompose({
      anonymousDeviceId:
        appShellStateRef.current.anonymousDeviceId ?? undefined,
      latestLocation: feedLocationRef.current,
      setFeedSortMode,
      setPostListState,
    });
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

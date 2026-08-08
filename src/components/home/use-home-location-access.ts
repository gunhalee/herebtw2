"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  canRetryDeniedBrowserGeolocation,
  getBrowserGeolocationPermissionState,
  observeBrowserGeolocationPermission,
} from "../../lib/geo/browser-location-support";
import {
  getBrowserLocationGuidance,
  type BrowserLocationContinuationAction,
  type BrowserLocationGuidance,
} from "../../lib/geo/browser-location-guidance";
import {
  clearBrowserLocationRecoveryAttempt,
  getBrowserLocationRecoveryContext,
  hasBrowserLocationRecoveryAttempt,
} from "../../lib/geo/browser-location-recovery";
import {
  refreshBrowserLocationSession,
  useBrowserLocationSession,
} from "../../lib/geo/browser-location-session";
import type { AppShellState } from "../../types/device";
import type { PostListState, PostLocation } from "../../types/post";
import type { AdministrativeLocationSnapshot } from "../../lib/geo/browser-administrative-location";
import { fetchActiveHomeFeedPage } from "./home-feed-api";
import {
  buildPostListErrorState,
  buildReadyPostListState,
  type PendingFeedSnapshot,
} from "./home-feed-state";

type UseHomeLocationAccessParams = {
  appShellStateRef: MutableRefObject<AppShellState>;
  applyDeniedLocationMode: () => void;
  applyResolvedLocationSelection: (
    location: AdministrativeLocationSnapshot,
    coordinates: PostLocation,
  ) => void;
  setFeedSortMode: Dispatch<SetStateAction<"nearby" | "global">>;
  setPendingFeedSnapshot: Dispatch<SetStateAction<PendingFeedSnapshot | null>>;
  setPostListState: Dispatch<SetStateAction<PostListState>>;
};

type LocationAccessRequestOptions = {
  transientRetryCompleted?: boolean;
};

export function useHomeLocationAccess({
  appShellStateRef,
  applyDeniedLocationMode,
  applyResolvedLocationSelection,
  setFeedSortMode,
  setPendingFeedSnapshot,
  setPostListState,
}: UseHomeLocationAccessParams) {
  const locationSession = useBrowserLocationSession();
  const [locationAccessGuidance, setLocationAccessGuidance] =
    useState<BrowserLocationGuidance | null>(null);
  const [locationAccessRequesting, setLocationAccessRequesting] =
    useState(false);
  const [recoveryAttemptCompleted, setRecoveryAttemptCompleted] =
    useState(false);
  const requestInFlightRef = useRef(false);
  const requestLocationAccessRef = useRef<() => void>(() => undefined);
  const locationAvailableRef = useRef(false);
  const locationAvailable = Boolean(
    locationSession.permissionMode === "granted" &&
      locationSession.coordinates &&
      locationSession.resolvedLocation,
  );
  const bannerGuidance = getBrowserLocationGuidance({
    coordinatesAvailable: Boolean(locationSession.coordinates),
    error: locationSession.error,
    permissionMode: locationSession.permissionMode,
    recoveryAttemptCompleted,
  });
  locationAvailableRef.current = locationAvailable;

  async function requestLocationAccess(
    options: LocationAccessRequestOptions = {},
  ) {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    setLocationAccessRequesting(true);
    setLocationAccessGuidance(null);

    try {
      const refreshedSession = await refreshBrowserLocationSession();
      const { coordinates, resolvedLocation } = refreshedSession;

      if (
        refreshedSession.permissionMode !== "granted" ||
        !coordinates ||
        !resolvedLocation
      ) {
        if (refreshedSession.permissionMode === "denied") {
          applyDeniedLocationMode();
        }

        setLocationAccessGuidance(
          getBrowserLocationGuidance({
            coordinatesAvailable: Boolean(coordinates),
            error: refreshedSession.error,
            permissionMode: refreshedSession.permissionMode,
            recoveryAttemptCompleted,
            transientRetryCompleted: options.transientRetryCompleted,
          }),
        );
        return;
      }

      applyResolvedLocationSelection(resolvedLocation, coordinates);
      clearBrowserLocationRecoveryAttempt();
      setRecoveryAttemptCompleted(false);
      const result = await fetchActiveHomeFeedPage(coordinates, {
        anonymousDeviceId:
          appShellStateRef.current.anonymousDeviceId ?? undefined,
      });

      setPendingFeedSnapshot(null);
      setFeedSortMode("nearby");
      setPostListState((current) =>
        buildReadyPostListState(current, {
          items: result.data.items,
          nextCursor: result.data.nextCursor,
          sort: result.postSort,
        }),
      );
    } catch (error) {
      setPostListState((current) =>
        current.items.length > 0
          ? current
          : buildPostListErrorState(
              current,
              error instanceof Error
                ? error.message
                : "주변 글을 불러오지 못했어요.",
            ),
      );
    } finally {
      requestInFlightRef.current = false;
      setLocationAccessRequesting(false);
    }
  }

  requestLocationAccessRef.current = () => {
    void requestLocationAccess();
  };

  useEffect(() => {
    let disposed = false;
    let removePermissionListener: () => void = () => undefined;

    const hasRecoveryAttempt = hasBrowserLocationRecoveryAttempt();
    const recoveryContext = getBrowserLocationRecoveryContext();
    setRecoveryAttemptCompleted(hasRecoveryAttempt);

    if (hasRecoveryAttempt && recoveryContext !== "compose") {
      requestLocationAccessRef.current();
    }

    const refreshAfterPermissionGrant = (
      state: PermissionState | "unsupported",
    ) => {
      if (
        !disposed &&
        state === "granted" &&
        !locationAvailableRef.current
      ) {
        requestLocationAccessRef.current();
      }
    };

    void observeBrowserGeolocationPermission(refreshAfterPermissionGrant).then(
      (removeListener) => {
        if (disposed) {
          removeListener();
          return;
        }

        removePermissionListener = removeListener;
      },
    );

    const checkPermissionAfterPageReturn = () => {
      setRecoveryAttemptCompleted(hasBrowserLocationRecoveryAttempt());

      if (
        document.visibilityState !== "visible" ||
        locationAvailableRef.current
      ) {
        return;
      }

      void getBrowserGeolocationPermissionState().then(
        refreshAfterPermissionGrant,
      );
    };

    const handleVisibilityChange = () => {
      checkPermissionAfterPageReturn();
    };

    const handlePageShow = () => {
      checkPermissionAfterPageReturn();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      disposed = true;
      removePermissionListener();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  function handleCloseLocationAccessDialog() {
    setLocationAccessGuidance(null);
  }

  function handleRequestLocationAccess(
    _action: BrowserLocationContinuationAction,
  ) {
    void requestLocationAccess();
  }

  async function handleRetryLocationAccess(
    action: BrowserLocationContinuationAction,
  ) {
    if (
      action === "fresh-location" &&
      locationSession.permissionMode === "denied" &&
      !(await canRetryDeniedBrowserGeolocation())
    ) {
      setLocationAccessGuidance(
        getBrowserLocationGuidance({
          permissionMode: "denied",
          transientRetryCompleted: true,
        }),
      );
      return;
    }

    setLocationAccessGuidance(null);
    void requestLocationAccess({ transientRetryCompleted: true });
  }

  return {
    bannerGuidance,
    handleCloseLocationAccessDialog,
    handleRequestLocationAccess,
    handleRetryLocationAccess,
    locationAccessDialogGuidance: locationAccessGuidance,
    locationAccessDialogOpen: locationAccessGuidance !== null,
    locationAccessRequesting,
    shouldShowLocationAccessBanner: !locationAvailable,
  };
}

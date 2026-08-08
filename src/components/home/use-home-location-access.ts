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
  getBrowserGeolocationPermissionState,
  observeBrowserGeolocationPermission,
} from "../../lib/geo/browser-location-support";
import {
  getBrowserLocationGuidance,
  type BrowserLocationGuidance,
} from "../../lib/geo/browser-location-guidance";
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
  const requestInFlightRef = useRef(false);
  const requestLocationAccessRef = useRef<() => void>(() => undefined);
  const locationAvailableRef = useRef(false);
  const locationAvailable = Boolean(
    locationSession.permissionMode === "granted" &&
      locationSession.coordinates &&
      locationSession.resolvedLocation,
  );
  const bannerGuidance = getBrowserLocationGuidance({
    error: locationSession.error,
    permissionMode: locationSession.permissionMode,
  });
  locationAvailableRef.current = locationAvailable;

  async function handleRequestLocationAccess() {
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
            error: refreshedSession.error,
            permissionMode: refreshedSession.permissionMode,
          }),
        );
        return;
      }

      applyResolvedLocationSelection(resolvedLocation, coordinates);
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
    void handleRequestLocationAccess();
  };

  useEffect(() => {
    let disposed = false;
    let removePermissionListener: () => void = () => undefined;

    const refreshAfterPermissionGrant = (
      state: PermissionState | "unsupported",
    ) => {
      if (state === "granted" && !locationAvailableRef.current) {
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

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible" || locationAvailableRef.current) {
        return;
      }

      void getBrowserGeolocationPermissionState().then(
        refreshAfterPermissionGrant,
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      removePermissionListener();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function handleCloseLocationAccessDialog() {
    setLocationAccessGuidance(null);
  }

  function handleRetryLocationAccess() {
    setLocationAccessGuidance(null);
    void handleRequestLocationAccess();
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

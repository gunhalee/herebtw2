"use client";

import { useState } from "react";
import {
  ensureRegisteredBrowserDevice,
  readBrowserAnonymousDeviceId,
} from "../../lib/device/browser-device";
import { syncAdministrativeLocationCookie } from "../../lib/geo/administrative-location-cookie";
import type { AdministrativeLocationSnapshot } from "../../lib/geo/browser-administrative-location";
import { useDocumentScrollLock } from "../../lib/hooks/use-document-scroll-lock";
import { useLatestRef } from "../../lib/hooks/use-latest-ref";
import { useMountedRef } from "../../lib/hooks/use-mounted-ref";
import type { AppShellState } from "../../types/device";
import type { PostListState, PostLocation } from "../../types/post";

const COMPOSE_PLACEHOLDER_DONG_NAME = "우리 동네";

type UseHomeShellStateParams = {
  initialAppShellState: AppShellState;
  initialPostListState: PostListState;
};

export function useHomeShellState({
  initialAppShellState,
  initialPostListState,
}: UseHomeShellStateParams) {
  const [appShellState, setAppShellState] = useState(initialAppShellState);
  const [feedLocation, setFeedLocation] = useState<PostLocation | null>(null);
  const [feedSortMode, setFeedSortMode] = useState<"nearby" | "global">(
    initialPostListState.sort === "latest" || initialAppShellState.readOnlyMode
      ? "global"
      : "nearby",
  );
  const isMountedRef = useMountedRef();
  const appShellStateRef = useLatestRef(appShellState);
  const feedLocationRef = useLatestRef(feedLocation);
  const hasInitialGlobalFeed =
    initialPostListState.sort === "latest" && !initialPostListState.loading;

  useDocumentScrollLock();

  function setAdministrativeLocationSelection(
    location: AdministrativeLocationSnapshot | null,
    options: {
      permissionMode: AppShellState["permissionMode"];
      readOnlyMode: boolean;
    },
  ) {
    setAppShellState((current) => ({
      ...current,
      permissionMode: options.permissionMode,
      readOnlyMode: options.readOnlyMode,
      selectedDongCode: location?.administrativeDongCode ?? null,
      selectedDongName: location?.administrativeDongName ?? null,
    }));
    syncAdministrativeLocationCookie(
      location
        ? {
            administrativeDongCode: location.administrativeDongCode,
            administrativeDongName: location.administrativeDongName,
          }
        : null,
    );
  }

  function applyResolvedLocationSelection(
    location: AdministrativeLocationSnapshot,
    coordinates: PostLocation,
  ) {
    setFeedLocation(coordinates);
    setAdministrativeLocationSelection(location, {
      permissionMode: "granted",
      readOnlyMode: false,
    });
  }

  function applyDeniedLocationMode() {
    setFeedLocation(null);
    setAdministrativeLocationSelection(null, {
      permissionMode: "denied",
      readOnlyMode: false,
    });
  }

  async function ensureDeviceReady() {
    const existingAnonymousDeviceId = appShellStateRef.current.anonymousDeviceId;

    if (existingAnonymousDeviceId) {
      return existingAnonymousDeviceId;
    }

    const localDeviceId = readBrowserAnonymousDeviceId();

    if (localDeviceId) {
      setAppShellState((current) => ({
        ...current,
        anonymousDeviceId: localDeviceId,
        deviceReady: true,
      }));

      void ensureRegisteredBrowserDevice().catch(() => undefined);

      return localDeviceId;
    }

    const anonymousDeviceId = await ensureRegisteredBrowserDevice();

    setAppShellState((current) => ({
      ...current,
      anonymousDeviceId,
      deviceReady: true,
    }));

    return anonymousDeviceId;
  }

  return {
    appShellStateRef,
    applyDeniedLocationMode,
    applyResolvedLocationSelection,
    currentDongName:
      appShellState.selectedDongName ?? COMPOSE_PLACEHOLDER_DONG_NAME,
    selectedDongCode: appShellState.selectedDongCode,
    ensureDeviceReady,
    feedLocation,
    feedLocationRef,
    feedSortMode,
    hasInitialGlobalFeed,
    isMountedRef,
    obscureGlobalFallbackList:
      appShellState.readOnlyMode && feedSortMode === "global",
    setAppShellState,
    setFeedSortMode,
  };
}

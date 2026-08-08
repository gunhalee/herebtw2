"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  abortActiveBrowserLocationRequest,
  ensureBrowserLocationResolutionToken,
  ensureBrowserLocationCoordinates,
  getBrowserLocationResolutionToken,
  isBrowserLocationAccurateForPost,
  refreshFreshBrowserLocationSession,
  useBrowserLocationSession,
} from "../../lib/geo/browser-location-session";
import type { PostComposeState, PostLocation } from "../../types/post";
import type { ManualAdministrativeLocationSelection } from "../../lib/geo/administrative-dong-search";
import { LOCATION_POLICY } from "../../lib/geo/location-policy";

type UseComposeLocationParams = {
  manualLocationSelection?: ManualAdministrativeLocationSelection | null;
  maximumAccuracyMeters?: number;
  setComposeState: Dispatch<SetStateAction<PostComposeState>>;
};

function toSubmitLocation(
  locationSession: ReturnType<typeof useBrowserLocationSession>,
  maximumAccuracyMeters: number,
): PostLocation | null {
  if (
    locationSession.coordinates &&
    isBrowserLocationAccurateForPost(locationSession, maximumAccuracyMeters)
  ) {
    return locationSession.coordinates;
  }

  return null;
}

export function useComposeLocation({
  manualLocationSelection = null,
  maximumAccuracyMeters = LOCATION_POLICY.submitBlockAboveMeters,
  setComposeState,
}: UseComposeLocationParams) {
  const [locationRefreshing, setLocationRefreshing] = useState(false);
  const locationSession = useBrowserLocationSession();
  const submitLocation =
    manualLocationSelection?.location ??
    toSubmitLocation(locationSession, maximumAccuracyMeters);
  const locationResolutionToken =
    manualLocationSelection?.locationResolutionToken ??
    getBrowserLocationResolutionToken(locationSession);
  const locationResolutionTokenPending = Boolean(
    !manualLocationSelection &&
      submitLocation &&
      !locationResolutionToken &&
      locationSession.permissionMode !== "denied",
  );
  const locationReadyForSubmit =
    Boolean(
      manualLocationSelection && submitLocation && locationResolutionToken,
    ) ||
    (!locationRefreshing &&
      locationSession.permissionMode !== "denied" &&
      submitLocation !== null &&
      locationResolutionToken !== null);
  const locationAccuracyWarning =
    manualLocationSelection || locationSession.accuracyMeters === null
      ? null
      : locationSession.accuracyMeters > LOCATION_POLICY.submitBlockAboveMeters
        ? "현재 위치 범위가 넓습니다. 정확한 동네 이름이 표시되지 않을 수 있어요."
        : locationSession.accuracyMeters >
            LOCATION_POLICY.submitWarningAboveMeters
          ? `현재 위치 정확도가 약 ${Math.round(locationSession.accuracyMeters)}m입니다. 위치가 다르면 다시 확인해 주세요.`
          : null;

  async function retryLocation() {
    if (manualLocationSelection) {
      return;
    }

    setLocationRefreshing(true);

    try {
      await refreshFreshBrowserLocationSession();
    } finally {
      setLocationRefreshing(false);
    }
  }

  useEffect(
    () => () => {
      abortActiveBrowserLocationRequest();
    },
    [],
  );

  useEffect(() => {
    if (manualLocationSelection || submitLocation) {
      return;
    }

    void ensureBrowserLocationCoordinates().catch(() => undefined);
  }, [manualLocationSelection, submitLocation]);

  useEffect(() => {
    if (!locationResolutionTokenPending) {
      return;
    }

    void ensureBrowserLocationResolutionToken({
      triggerRefresh: true,
    }).catch(() => undefined);
  }, [locationResolutionTokenPending]);

  useEffect(() => {
    setComposeState((current) => ({
      ...current,
      errorMessage: locationReadyForSubmit
        ? null
        : current.submitting
          ? "위치 정보를 로드하고 있어요. 잠시만 기다려주세요."
          : current.errorMessage,
    }));
  }, [locationReadyForSubmit, setComposeState]);

  return {
    locationAccuracyWarning,
    locationDisplayName:
      manualLocationSelection?.formattedAdministrativeAreaName ??
      locationSession.resolvedLocation?.formattedAdministrativeAreaName ??
      null,
    locationRefreshing,
    locationReadyForSubmit,
    locationResolutionTokenPending,
    locationResolutionToken,
    locationSource: manualLocationSelection
      ? ("manual" as const)
      : ("browser" as const),
    retryLocation,
    submitLocation,
  };
}

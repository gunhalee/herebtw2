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

type UseComposeLocationParams = {
  setComposeState: Dispatch<SetStateAction<PostComposeState>>;
};

function toSubmitLocation(
  locationSession: ReturnType<typeof useBrowserLocationSession>,
): PostLocation | null {
  if (
    locationSession.coordinates &&
    isBrowserLocationAccurateForPost(locationSession)
  ) {
    return locationSession.coordinates;
  }

  return null;
}

export function useComposeLocation({
  setComposeState,
}: UseComposeLocationParams) {
  const [locationRefreshing, setLocationRefreshing] = useState(false);
  const locationSession = useBrowserLocationSession();
  const submitLocation = toSubmitLocation(locationSession);
  const locationResolutionToken = getBrowserLocationResolutionToken(locationSession);
  const locationResolutionTokenPending = Boolean(
    submitLocation &&
      !locationResolutionToken &&
      locationSession.permissionMode !== "denied",
  );
  const locationReadyForSubmit =
    !locationRefreshing &&
    locationSession.permissionMode !== "denied" &&
    submitLocation !== null &&
    locationResolutionToken !== null;
  const locationAccuracyWarning =
    locationSession.accuracyMeters !== null &&
    locationSession.accuracyMeters > 500
      ? "정확한 위치를 확인할 수 없습니다. 브라우저의 정확한 위치 권한을 켠 뒤 다시 시도해 주세요."
      : locationSession.accuracyMeters !== null &&
          locationSession.accuracyMeters > 100
        ? `현재 위치 정확도가 약 ${Math.round(locationSession.accuracyMeters)}m입니다. 위치가 다르면 다시 확인해 주세요.`
        : null;

  async function retryLocation() {
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
    if (submitLocation) {
      return;
    }

    void ensureBrowserLocationCoordinates().catch(() => undefined);
  }, [submitLocation]);

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
    locationRefreshing,
    locationReadyForSubmit,
    locationResolutionTokenPending,
    locationResolutionToken,
    retryLocation,
    submitLocation,
  };
}

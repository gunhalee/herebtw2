"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  ensureBrowserLocationResolutionToken,
  ensureBrowserLocationCoordinates,
  getBrowserLocationResolutionToken,
  useBrowserLocationSession,
} from "../../lib/geo/browser-location-session";
import type { PostComposeState, PostLocation } from "../../types/post";

type UseComposeLocationParams = {
  setComposeState: Dispatch<SetStateAction<PostComposeState>>;
};

function toSubmitLocation(
  locationSession: ReturnType<typeof useBrowserLocationSession>,
): PostLocation | null {
  if (locationSession.coordinates) {
    return locationSession.coordinates;
  }

  if (locationSession.resolvedLocation) {
    return {
      latitude: locationSession.resolvedLocation.latitude,
      longitude: locationSession.resolvedLocation.longitude,
    };
  }

  return null;
}

export function useComposeLocation({
  setComposeState,
}: UseComposeLocationParams) {
  const locationSession = useBrowserLocationSession();
  const submitLocation = toSubmitLocation(locationSession);
  const locationResolutionToken = getBrowserLocationResolutionToken(locationSession);
  const locationResolutionTokenPending = Boolean(
    submitLocation &&
      !locationResolutionToken &&
      locationSession.permissionMode !== "denied",
  );
  const locationReadyForSubmit =
    locationSession.permissionMode !== "denied" && submitLocation !== null;

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
      maxWaitMs: 0,
      triggerRefresh: true,
    }).catch(() => undefined);
  }, [locationResolutionTokenPending]);

  useEffect(() => {
    setComposeState((current) => ({
      ...current,
      errorMessage: locationReadyForSubmit
        ? null
        : current.submitting
          ? "현재 위치 확인이 끝난 뒤에 글을 등록할 수 있어요."
          : current.errorMessage,
    }));
  }, [locationReadyForSubmit, setComposeState]);

  return {
    locationReadyForSubmit,
    locationResolutionTokenPending,
    locationResolutionToken,
    submitLocation,
  };
}

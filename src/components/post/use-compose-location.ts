"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  getBrowserLocationErrorMessage,
  type ResolvedAdministrativeLocation,
} from "../../lib/geo/browser-administrative-location-resolver";
import {
  ensureBrowserLocationSession,
  isBrowserLocationSessionFresh,
  useBrowserLocationSession,
} from "../../lib/geo/browser-location-session";
import type { PostComposeState } from "../../types/post";

type UseComposeLocationParams = {
  setComposeState: Dispatch<SetStateAction<PostComposeState>>;
};

function getComposeLocationStatus(
  resolvedLocation: ResolvedAdministrativeLocation | null,
  locationSession: ReturnType<typeof useBrowserLocationSession>,
) {
  const locationSessionFresh = isBrowserLocationSessionFresh(locationSession);

  if (locationSession.permissionMode === "denied") {
    return {
      locationReadyForSubmit: false,
      locationStatusText: getBrowserLocationErrorMessage(locationSession.error),
      locationStatusTone: "danger" as const,
    };
  }

  if (resolvedLocation) {
    if (locationSession.phase === "administrative_verified" && locationSessionFresh) {
      return {
        locationReadyForSubmit: true,
        locationStatusText: null,
        locationStatusTone: "neutral" as const,
      };
    }

    if (locationSession.permissionMode === "granted" && locationSessionFresh) {
      return {
        locationReadyForSubmit: true,
        locationStatusText: "가장 최근에 확인한 동네를 사용하고 있어요.",
        locationStatusTone: "neutral" as const,
      };
    }

    if (locationSession.error) {
      return {
        locationReadyForSubmit: false,
        locationStatusText: getBrowserLocationErrorMessage(locationSession.error),
        locationStatusTone: "danger" as const,
      };
    }

    return {
      locationReadyForSubmit: false,
      locationStatusText: "현재 위치를 다시 확인하는 중이에요.",
      locationStatusTone: "neutral" as const,
    };
  }

  if (locationSession.error) {
    return {
      locationReadyForSubmit: false,
      locationStatusText: getBrowserLocationErrorMessage(locationSession.error),
      locationStatusTone: "danger" as const,
    };
  }

  return {
    locationReadyForSubmit: false,
    locationStatusText: "현재 위치를 확인하는 중이에요.",
    locationStatusTone: "neutral" as const,
  };
}

export function useComposeLocation({
  setComposeState,
}: UseComposeLocationParams) {
  const locationSession = useBrowserLocationSession();
  const resolvedLocation = locationSession.resolvedLocation;
  const {
    locationReadyForSubmit,
    locationStatusText,
    locationStatusTone,
  } = getComposeLocationStatus(resolvedLocation, locationSession);

  useEffect(() => {
    void ensureBrowserLocationSession().catch(() => undefined);
  }, []);

  useEffect(() => {
    setComposeState((current) => ({
      ...current,
      locationResolved: locationReadyForSubmit,
      resolvedDongName: resolvedLocation?.administrativeDongName ?? null,
      resolvedDongCode: resolvedLocation?.administrativeDongCode ?? null,
      errorMessage: locationReadyForSubmit
        ? null
        : current.submitting
          ? "현재 위치 확인이 끝난 뒤에 글을 등록할 수 있어요."
          : current.errorMessage,
    }));
  }, [locationReadyForSubmit, resolvedLocation, setComposeState]);

  return {
    locationReadyForSubmit,
    locationStatusText,
    locationStatusTone,
    resolvedLocation,
  };
}

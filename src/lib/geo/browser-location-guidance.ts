import type { AppShellState } from "../../types/device";
import { getBrowserLocationFailureCode } from "./browser-location-support";
import {
  getBrowserLocationFailureGuidance,
  getManualLocationFallbackGuidance,
} from "./browser-location-failure-guidance";
import { LOCATION_POLICY } from "./location-policy";

export type BrowserLocationContinuationAction =
  | "fresh-location"
  | "resolve-location";

export type BrowserLocationRetryAction =
  | BrowserLocationContinuationAction
  | "external-browser"
  | "new-window"
  | "reload"
  | "secure-page";

export type BrowserLocationGuidance = {
  manualSearchAvailable: boolean;
  message: string;
  primaryAction: "manual" | "retry";
  retryAction?: BrowserLocationRetryAction;
  retryLabel: string;
  retryAvailable: boolean;
  steps: string[];
  title: string;
};

type BrowserLocationGuidanceInput = {
  accuracyMeters?: number | null;
  accuracyRetryCompleted?: boolean;
  coordinatesAvailable?: boolean;
  error?: unknown;
  permissionMode?: AppShellState["permissionMode"];
  recoveryAttemptCompleted?: boolean;
  transientRetryCompleted?: boolean;
  userAgent?: string;
};

function getUserAgent(inputUserAgent?: string) {
  if (typeof inputUserAgent === "string") {
    return inputUserAgent;
  }

  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

export function getBrowserLocationGuidance({
  accuracyMeters,
  accuracyRetryCompleted = false,
  coordinatesAvailable = false,
  error,
  permissionMode = "unknown",
  recoveryAttemptCompleted = false,
  transientRetryCompleted = false,
  userAgent,
}: BrowserLocationGuidanceInput = {}): BrowserLocationGuidance {
  const resolvedUserAgent = getUserAgent(userAgent);

  if (
    typeof accuracyMeters === "number" &&
    accuracyMeters > LOCATION_POLICY.submitBlockAboveMeters
  ) {
    if (
      accuracyRetryCompleted &&
      accuracyMeters > LOCATION_POLICY.submitFallbackMaxMeters
    ) {
      return getManualLocationFallbackGuidance();
    }

    return {
      title: "위치 오차 범위가 넓은 상태입니다.",
      message:
        "정확한 동네를 확인하기 위해 위치를 한 번 더 받아올게요. 가능하면 창가나 실외에서 다시 시도해 주세요.",
      steps: [],
      retryLabel: "위치 다시 확인",
      retryAction: "fresh-location",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (coordinatesAvailable && permissionMode === "granted" && error) {
    if (transientRetryCompleted) {
      return getManualLocationFallbackGuidance();
    }

    return {
      title: "동네 정보를 확인하지 못했어요",
      message: "현재 위치의 동네 정보를 다시 불러오겠습니다.",
      steps: [],
      retryLabel: "동네 정보 다시 불러오기",
      retryAction: "resolve-location",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (
    (permissionMode === "prompt" || permissionMode === "unknown") &&
    !error
  ) {
    return {
      title: "내 주변 이야기를 찾아볼까요?",
      message:
        "위치 정보는 주변 글을 불러오기 위해 사용하며, 저장되지 않습니다.",
      steps: [],
      retryLabel: "내 주변 보기",
      retryAction: "fresh-location",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (permissionMode === "denied" && !error) {
    return getBrowserLocationFailureGuidance({
      code: "GEOLOCATION_PERMISSION_DENIED",
      recoveryAttemptCompleted,
      transientRetryCompleted,
      userAgent: resolvedUserAgent,
    });
  }

  return getBrowserLocationFailureGuidance({
    code: getBrowserLocationFailureCode(error),
    recoveryAttemptCompleted,
    transientRetryCompleted,
    userAgent: resolvedUserAgent,
  });
}

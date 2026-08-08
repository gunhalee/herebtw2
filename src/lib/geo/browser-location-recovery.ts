import {
  openCurrentPageInAndroidChrome,
  openCurrentPageInNewWindow,
  openCurrentPageSecurely,
  reloadCurrentPage,
} from "./browser-external-navigation";
import type {
  BrowserLocationContinuationAction,
  BrowserLocationRetryAction,
} from "./browser-location-guidance";

const LOCATION_RECOVERY_ATTEMPT_KEY = "herebtw:location-recovery-attempt:v1";
const LOCATION_RECOVERY_HISTORY_KEY = "__herebtwLocationRecoveryAttemptedAt";
const LOCATION_RECOVERY_ATTEMPT_TTL_MS = 10 * 60 * 1000;

function getFreshRecoveryAttempt(attemptedAt: unknown) {
  const timestamp = Number(attemptedAt);

  return (
    Number.isFinite(timestamp) &&
    timestamp > 0 &&
    Date.now() - timestamp <= LOCATION_RECOVERY_ATTEMPT_TTL_MS
  );
}

function getHistoryRecoveryAttempt() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const historyState = window.history.state;

    return getFreshRecoveryAttempt(
      historyState && typeof historyState === "object"
        ? historyState[LOCATION_RECOVERY_HISTORY_KEY]
        : null,
    );
  } catch {
    return false;
  }
}

function isNavigationRecoveryAction(action: BrowserLocationRetryAction) {
  return (
    action === "external-browser" ||
    action === "new-window" ||
    action === "reload" ||
    action === "secure-page"
  );
}

export function hasBrowserLocationRecoveryAttempt() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const attemptedAt =
      window.sessionStorage.getItem(LOCATION_RECOVERY_ATTEMPT_KEY);
    const isFreshAttempt = getFreshRecoveryAttempt(attemptedAt);

    if (!isFreshAttempt) {
      window.sessionStorage.removeItem(LOCATION_RECOVERY_ATTEMPT_KEY);
    }

    return isFreshAttempt || getHistoryRecoveryAttempt();
  } catch {
    return getHistoryRecoveryAttempt();
  }
}

export function clearBrowserLocationRecoveryAttempt() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(LOCATION_RECOVERY_ATTEMPT_KEY);
  } catch {
    // Storage access is best-effort in private or embedded browsers.
  }

  try {
    const historyState = window.history.state;

    if (historyState && typeof historyState === "object") {
      const nextHistoryState = { ...historyState };
      delete nextHistoryState[LOCATION_RECOVERY_HISTORY_KEY];
      window.history.replaceState(nextHistoryState, "");
    }
  } catch {
    // History state cleanup is also best-effort.
  }
}

function markBrowserLocationRecoveryAttempt() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      LOCATION_RECOVERY_ATTEMPT_KEY,
      String(Date.now()),
    );
  } catch {
    // Navigation still proceeds when storage is unavailable.
  }

  try {
    const historyState = window.history.state;
    const nextHistoryState =
      historyState && typeof historyState === "object"
        ? { ...historyState }
        : {};

    window.history.replaceState(
      {
        ...nextHistoryState,
        [LOCATION_RECOVERY_HISTORY_KEY]: Date.now(),
      },
      "",
    );
  } catch {
    // Navigation still proceeds when history state is unavailable.
  }
}

export function runBrowserLocationRetryAction(
  action: BrowserLocationRetryAction | undefined,
  continueRetry: (action: BrowserLocationContinuationAction) => void,
) {
  if (action && isNavigationRecoveryAction(action)) {
    markBrowserLocationRecoveryAttempt();
  }

  if (action === "external-browser") {
    openCurrentPageInAndroidChrome();
    return;
  }

  if (action === "new-window") {
    openCurrentPageInNewWindow();
    return;
  }

  if (action === "reload") {
    reloadCurrentPage();
    return;
  }

  if (action === "secure-page") {
    openCurrentPageSecurely();
    return;
  }

  continueRetry(action ?? "fresh-location");
}

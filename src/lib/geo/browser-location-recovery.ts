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
const LOCATION_RECOVERY_CONTEXT_KEY = "herebtw:location-recovery-context:v1";
const LOCATION_RECOVERY_HISTORY_KEY = "__herebtwLocationRecoveryAttemptedAt";
const LOCATION_RECOVERY_HISTORY_CONTEXT_KEY =
  "__herebtwLocationRecoveryContext";
const LOCATION_RECOVERY_ATTEMPT_TTL_MS = 10 * 60 * 1000;

export type BrowserLocationRecoveryContext = "access" | "compose";

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

function isBrowserLocationRecoveryContext(
  value: unknown,
): value is BrowserLocationRecoveryContext {
  return value === "access" || value === "compose";
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

export function getBrowserLocationRecoveryContext(): BrowserLocationRecoveryContext | null {
  if (typeof window === "undefined" || !hasBrowserLocationRecoveryAttempt()) {
    return null;
  }

  try {
    const storedContext = window.sessionStorage.getItem(
      LOCATION_RECOVERY_CONTEXT_KEY,
    );

    if (isBrowserLocationRecoveryContext(storedContext)) {
      return storedContext;
    }
  } catch {
    // History state is used when session storage is unavailable.
  }

  try {
    const historyState = window.history.state;
    const historyContext =
      historyState && typeof historyState === "object"
        ? historyState[LOCATION_RECOVERY_HISTORY_CONTEXT_KEY]
        : null;

    return isBrowserLocationRecoveryContext(historyContext)
      ? historyContext
      : null;
  } catch {
    return null;
  }
}

export function clearBrowserLocationRecoveryAttempt() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(LOCATION_RECOVERY_ATTEMPT_KEY);
    window.sessionStorage.removeItem(LOCATION_RECOVERY_CONTEXT_KEY);
  } catch {
    // Storage access is best-effort in private or embedded browsers.
  }

  try {
    const historyState = window.history.state;

    if (historyState && typeof historyState === "object") {
      const nextHistoryState = { ...historyState };
      delete nextHistoryState[LOCATION_RECOVERY_HISTORY_KEY];
      delete nextHistoryState[LOCATION_RECOVERY_HISTORY_CONTEXT_KEY];
      window.history.replaceState(nextHistoryState, "");
    }
  } catch {
    // History state cleanup is also best-effort.
  }
}

function markBrowserLocationRecoveryAttempt(
  context?: BrowserLocationRecoveryContext,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      LOCATION_RECOVERY_ATTEMPT_KEY,
      String(Date.now()),
    );
    if (context) {
      window.sessionStorage.setItem(LOCATION_RECOVERY_CONTEXT_KEY, context);
    }
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
        ...(context
          ? { [LOCATION_RECOVERY_HISTORY_CONTEXT_KEY]: context }
          : {}),
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
  recoveryContext?: BrowserLocationRecoveryContext,
) {
  if (action && isNavigationRecoveryAction(action)) {
    markBrowserLocationRecoveryAttempt(recoveryContext);
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

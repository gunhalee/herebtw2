"use client";

import { useSyncExternalStore } from "react";
import type { AppShellState } from "../../types/device";
import type { PostLocation } from "../../types/post";
import {
  readCachedAdministrativeLocation,
  writeCachedAdministrativeLocation,
} from "./browser-administrative-location";
import { syncAdministrativeLocationCookie } from "./administrative-location-cookie";
import {
  getBrowserLocationPermissionMode,
  resolveAdministrativeLocation,
  type ResolvedAdministrativeLocation,
} from "./browser-administrative-location-resolver";
import { getCurrentBrowserCoordinates } from "./browser-location";

export type BrowserLocationSessionPhase =
  | "idle"
  | "primed"
  | "coordinates_pending"
  | "coordinates_ready"
  | "administrative_cached"
  | "administrative_verified"
  | "error";

export type BrowserLocationSessionState = {
  coordinates: PostLocation | null;
  resolvedLocation: ResolvedAdministrativeLocation | null;
  lastCoordinatesAt: number | null;
  permissionMode: AppShellState["permissionMode"];
  phase: BrowserLocationSessionPhase;
  error: unknown | null;
};

type EnsureBrowserLocationResolutionTokenOptions = {
  maxWaitMs?: number;
  triggerRefresh?: boolean;
};

const BROWSER_LOCATION_SESSION_FRESHNESS_TTL_MS = 1000 * 60 * 3;
const LOCATION_RESOLUTION_TOKEN_MIN_REMAINING_MS = 1000 * 20;

const INITIAL_BROWSER_LOCATION_SESSION_STATE: BrowserLocationSessionState = {
  coordinates: null,
  resolvedLocation: null,
  lastCoordinatesAt: null,
  permissionMode: "unknown",
  phase: "idle",
  error: null,
};

let browserLocationSessionState = INITIAL_BROWSER_LOCATION_SESSION_STATE;
let coordinatesRefreshPromise: Promise<BrowserLocationSessionState> | null =
  null;
let refreshPromise: Promise<BrowserLocationSessionState> | null = null;
let refreshSequence = 0;

const browserLocationSessionListeners = new Set<() => void>();

function emitBrowserLocationSessionChange() {
  for (const listener of browserLocationSessionListeners) {
    listener();
  }
}

function hasUsableLocationResolutionToken(
  resolvedLocation: ResolvedAdministrativeLocation | null,
) {
  return Boolean(
    resolvedLocation?.locationResolutionToken &&
      resolvedLocation.locationResolutionTokenExpiresAt &&
      resolvedLocation.locationResolutionTokenExpiresAt - Date.now() >
        LOCATION_RESOLUTION_TOKEN_MIN_REMAINING_MS,
  );
}

function getLocationResolutionTokenFromSession(
  locationSession: BrowserLocationSessionState,
) {
  const { resolvedLocation } = locationSession;

  if (!resolvedLocation || !hasUsableLocationResolutionToken(resolvedLocation)) {
    return null;
  }

  return resolvedLocation.locationResolutionToken ?? null;
}

function setBrowserLocationSessionState(
  nextState:
    | BrowserLocationSessionState
    | ((
        currentState: BrowserLocationSessionState,
      ) => BrowserLocationSessionState),
) {
  const resolvedNextState =
    typeof nextState === "function"
      ? nextState(browserLocationSessionState)
      : nextState;

  if (resolvedNextState === browserLocationSessionState) {
    return;
  }

  browserLocationSessionState = resolvedNextState;
  emitBrowserLocationSessionChange();
}

function createCachedResolvedLocation(
  location: PostLocation,
  administrativeLocation: NonNullable<
    ReturnType<typeof readCachedAdministrativeLocation>
  >,
): ResolvedAdministrativeLocation {
  return {
    ...location,
    ...administrativeLocation,
    countryCode: null,
    formattedAdministrativeAreaName:
      administrativeLocation.administrativeDongName,
  };
}

function buildLocationStateFromCoordinates(
  location: PostLocation,
  permissionMode: AppShellState["permissionMode"],
  options?: {
    lastCoordinatesAt?: number | null;
  },
) {
  const cachedAdministrativeLocation = readCachedAdministrativeLocation(location);

  return {
    coordinates: location,
    lastCoordinatesAt: options?.lastCoordinatesAt ?? null,
    resolvedLocation: cachedAdministrativeLocation
      ? createCachedResolvedLocation(location, cachedAdministrativeLocation)
      : null,
    permissionMode,
    phase: cachedAdministrativeLocation
      ? "administrative_cached"
      : "coordinates_ready",
    error: null,
  } satisfies BrowserLocationSessionState;
}

function applyCoordinatesToBrowserLocationSession(
  location: PostLocation,
  permissionMode: AppShellState["permissionMode"],
  options?: {
    lastCoordinatesAt?: number | null;
  },
) {
  setBrowserLocationSessionState(
    buildLocationStateFromCoordinates(location, permissionMode, options),
  );
}

function subscribeBrowserLocationSession(listener: () => void) {
  browserLocationSessionListeners.add(listener);

  return () => {
    browserLocationSessionListeners.delete(listener);
  };
}

function getBrowserLocationSessionSnapshot() {
  return browserLocationSessionState;
}

async function waitForSessionWithTimeout(
  promise: Promise<BrowserLocationSessionState>,
  maxWaitMs: number | undefined,
) {
  if (typeof maxWaitMs !== "number" || !Number.isFinite(maxWaitMs)) {
    try {
      return await promise;
    } catch {
      return getBrowserLocationSessionSnapshot();
    }
  }

  if (maxWaitMs <= 0) {
    return getBrowserLocationSessionSnapshot();
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise.catch(() => getBrowserLocationSessionSnapshot()),
      new Promise<BrowserLocationSessionState>((resolve) => {
        timeoutHandle = setTimeout(() => {
          resolve(getBrowserLocationSessionSnapshot());
        }, maxWaitMs);
      }),
    ]);
  } finally {
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle);
    }
  }
}

export function useBrowserLocationSession() {
  return useSyncExternalStore(
    subscribeBrowserLocationSession,
    getBrowserLocationSessionSnapshot,
    getBrowserLocationSessionSnapshot,
  );
}

export function primeBrowserLocationSession(location: PostLocation) {
  if (typeof window === "undefined") {
    return browserLocationSessionState;
  }

  const nextState = buildLocationStateFromCoordinates(location, "unknown");

  setBrowserLocationSessionState({
    ...nextState,
    phase:
      nextState.phase === "administrative_cached" ? nextState.phase : "primed",
  });

  return getBrowserLocationSessionSnapshot();
}

export function hasBrowserLocationResolutionToken(
  locationSession: BrowserLocationSessionState,
) {
  return Boolean(getLocationResolutionTokenFromSession(locationSession));
}

export function getBrowserLocationResolutionToken(
  locationSession: BrowserLocationSessionState,
) {
  return getLocationResolutionTokenFromSession(locationSession);
}

export function isBrowserLocationSessionFresh(
  locationSession: BrowserLocationSessionState,
) {
  return Boolean(
    hasFreshBrowserLocationCoordinates(locationSession) &&
      locationSession.resolvedLocation,
  );
}

export function hasFreshBrowserLocationCoordinates(
  locationSession: BrowserLocationSessionState,
) {
  return Boolean(
    locationSession.permissionMode === "granted" &&
      locationSession.coordinates &&
      locationSession.lastCoordinatesAt &&
      Date.now() - locationSession.lastCoordinatesAt <=
        BROWSER_LOCATION_SESSION_FRESHNESS_TTL_MS,
  );
}

function beginBrowserLocationSessionRefresh() {
  if (coordinatesRefreshPromise && refreshPromise) {
    return {
      coordinatesRefreshPromise,
      refreshPromise,
    };
  }

  const currentRefreshSequence = refreshSequence + 1;
  refreshSequence = currentRefreshSequence;
  const canReuseFreshCoordinates = hasFreshBrowserLocationCoordinates(
    browserLocationSessionState,
  );
  const freshCoordinates = canReuseFreshCoordinates
    ? browserLocationSessionState.coordinates
    : null;
  const freshCoordinatesCapturedAt = canReuseFreshCoordinates
    ? browserLocationSessionState.lastCoordinatesAt
    : null;

  setBrowserLocationSessionState((currentState) => ({
    ...currentState,
    error: null,
    phase: canReuseFreshCoordinates ? currentState.phase : "coordinates_pending",
  }));

  if (freshCoordinates && freshCoordinatesCapturedAt) {
    coordinatesRefreshPromise = Promise.resolve(getBrowserLocationSessionSnapshot());
  } else {
    coordinatesRefreshPromise = (async () => {
      try {
        const coordinates = await getCurrentBrowserCoordinates();
        const lastCoordinatesAt = Date.now();

        if (currentRefreshSequence !== refreshSequence) {
          return getBrowserLocationSessionSnapshot();
        }

        applyCoordinatesToBrowserLocationSession(coordinates, "granted", {
          lastCoordinatesAt,
        });
      } catch (error) {
        if (currentRefreshSequence !== refreshSequence) {
          return getBrowserLocationSessionSnapshot();
        }

      setBrowserLocationSessionState({
        coordinates: null,
        resolvedLocation: null,
        lastCoordinatesAt: null,
        permissionMode: getBrowserLocationPermissionMode(error),
        phase: "error",
        error,
      });
      syncAdministrativeLocationCookie(null);
      }

      return getBrowserLocationSessionSnapshot();
    })();
  }

  refreshPromise = (async () => {
    try {
      const locationSession = await coordinatesRefreshPromise!;

      if (currentRefreshSequence !== refreshSequence) {
        return getBrowserLocationSessionSnapshot();
      }

      if (!locationSession.coordinates) {
        return getBrowserLocationSessionSnapshot();
      }

      const coordinates = freshCoordinates ?? locationSession.coordinates;
      const lastCoordinatesAt =
        freshCoordinatesCapturedAt ?? locationSession.lastCoordinatesAt;

      if (!coordinates || !lastCoordinatesAt) {
        return getBrowserLocationSessionSnapshot();
      }

      const resolvedLocation = await resolveAdministrativeLocation(coordinates);

      if (currentRefreshSequence !== refreshSequence) {
        return getBrowserLocationSessionSnapshot();
      }

      writeCachedAdministrativeLocation(coordinates, {
        administrativeDongName: resolvedLocation.administrativeDongName,
        administrativeDongCode: resolvedLocation.administrativeDongCode,
        locationResolutionToken: resolvedLocation.locationResolutionToken,
        locationResolutionTokenExpiresAt:
          resolvedLocation.locationResolutionTokenExpiresAt,
      });

      setBrowserLocationSessionState({
        coordinates,
        lastCoordinatesAt,
        resolvedLocation,
        permissionMode: "granted",
        phase: "administrative_verified",
        error: null,
      });
    } catch (error) {
      if (currentRefreshSequence !== refreshSequence) {
        return getBrowserLocationSessionSnapshot();
      }

      setBrowserLocationSessionState((currentState) => ({
        ...currentState,
        error,
        permissionMode:
          currentState.permissionMode === "denied"
            ? currentState.permissionMode
            : "granted",
        phase: currentState.resolvedLocation
          ? "administrative_cached"
          : currentState.coordinates
            ? "coordinates_ready"
            : "error",
      }));
      if (!getBrowserLocationSessionSnapshot().resolvedLocation) {
        syncAdministrativeLocationCookie(null);
      }
    } finally {
      if (currentRefreshSequence === refreshSequence) {
        coordinatesRefreshPromise = null;
        refreshPromise = null;
      }
    }

    return getBrowserLocationSessionSnapshot();
  })();

  return {
    coordinatesRefreshPromise,
    refreshPromise,
  };
}

export async function refreshBrowserLocationCoordinates() {
  if (typeof window === "undefined") {
    return getBrowserLocationSessionSnapshot();
  }

  return beginBrowserLocationSessionRefresh().coordinatesRefreshPromise;
}

export async function refreshBrowserLocationSession() {
  if (typeof window === "undefined") {
    return getBrowserLocationSessionSnapshot();
  }

  return beginBrowserLocationSessionRefresh().refreshPromise;
}

export async function ensureBrowserLocationCoordinates() {
  if (coordinatesRefreshPromise) {
    return coordinatesRefreshPromise;
  }

  if (browserLocationSessionState.permissionMode === "denied") {
    return getBrowserLocationSessionSnapshot();
  }

  if (hasFreshBrowserLocationCoordinates(browserLocationSessionState)) {
    return getBrowserLocationSessionSnapshot();
  }

  return refreshBrowserLocationCoordinates();
}

export async function ensureBrowserLocationSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  if (browserLocationSessionState.permissionMode === "denied") {
    return getBrowserLocationSessionSnapshot();
  }

  if (isBrowserLocationSessionFresh(browserLocationSessionState)) {
    return getBrowserLocationSessionSnapshot();
  }

  return refreshBrowserLocationSession();
}

export async function ensureBrowserLocationResolutionToken(
  options?: EnsureBrowserLocationResolutionTokenOptions,
) {
  if (typeof window === "undefined") {
    return null;
  }

  const currentSession = getBrowserLocationSessionSnapshot();
  const existingToken = getLocationResolutionTokenFromSession(currentSession);

  if (existingToken) {
    return existingToken;
  }

  if (currentSession.permissionMode === "denied") {
    return null;
  }

  const pendingRefresh = refreshPromise;

  if (pendingRefresh) {
    const session = await waitForSessionWithTimeout(
      pendingRefresh,
      options?.maxWaitMs,
    );

    return getLocationResolutionTokenFromSession(session);
  }

  if (options?.triggerRefresh === false) {
    return null;
  }

  const refreshedSession = await waitForSessionWithTimeout(
    refreshBrowserLocationSession(),
    options?.maxWaitMs,
  );

  return getLocationResolutionTokenFromSession(refreshedSession);
}

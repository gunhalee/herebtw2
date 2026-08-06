import { LOCATION_POLICY } from "./location-policy";

export type BrowserLocationMeasurement = {
  latitude: number;
  longitude: number;
  accuracy: number;
  measuredAt: number;
};

type BrowserLocationRequestOptions = {
  enableHighAccuracy?: boolean;
  maximumAgeMs?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type AccurateBrowserLocationRequestOptions = {
  maxWaitMs?: number;
  onProgress?: (measurement: BrowserLocationMeasurement) => void;
  signal?: AbortSignal;
  targetAccuracyMeters?: number;
};

function makeGeolocationError(code: string) {
  return new Error(code);
}

function canUseBrowserGeolocation() {
  return typeof window !== "undefined" && "geolocation" in navigator;
}

function toBrowserLocationMeasurement(
  position: GeolocationPosition,
): BrowserLocationMeasurement {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    measuredAt: position.timestamp,
  };
}

function isUsableLocationMeasurement(
  measurement: BrowserLocationMeasurement,
) {
  const ageMs = Date.now() - measurement.measuredAt;

  return (
    Number.isFinite(measurement.latitude) &&
    Number.isFinite(measurement.longitude) &&
    Number.isFinite(measurement.accuracy) &&
    measurement.accuracy >= 0 &&
    ageMs >= 0 &&
    ageMs <= LOCATION_POLICY.maximumMeasurementAgeMs
  );
}

export function getCurrentBrowserCoordinates(
  options: BrowserLocationRequestOptions = {},
): Promise<BrowserLocationMeasurement> {
  if (!canUseBrowserGeolocation()) {
    return Promise.reject(makeGeolocationError("GEOLOCATION_UNAVAILABLE"));
  }

  const {
    enableHighAccuracy = false,
    maximumAgeMs = LOCATION_POLICY.browserMaximumAgeMs,
    signal,
    timeoutMs = LOCATION_POLICY.browserTimeoutMs,
  } = options;

  return new Promise((resolve, reject) => {
    let settled = false;

    function cleanup() {
      signal?.removeEventListener("abort", handleAbort);
    }

    function finish(
      callback: () => void,
    ) {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback();
    }

    function handleAbort() {
      finish(() => reject(makeGeolocationError("GEOLOCATION_ABORTED")));
    }

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener("abort", handleAbort, { once: true });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        finish(() => resolve(toBrowserLocationMeasurement(position)));
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          finish(() =>
            reject(makeGeolocationError("GEOLOCATION_PERMISSION_DENIED")),
          );
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          finish(() =>
            reject(makeGeolocationError("GEOLOCATION_POSITION_UNAVAILABLE")),
          );
          return;
        }

        if (error.code === error.TIMEOUT) {
          finish(() => reject(makeGeolocationError("GEOLOCATION_TIMEOUT")));
          return;
        }

        finish(() => reject(makeGeolocationError("GEOLOCATION_FAILED")));
      },
      {
        enableHighAccuracy,
        maximumAge: maximumAgeMs,
        timeout: timeoutMs,
      },
    );
  });
}

export function getAccurateBrowserCoordinates(
  options: AccurateBrowserLocationRequestOptions = {},
): Promise<BrowserLocationMeasurement> {
  if (!canUseBrowserGeolocation()) {
    return Promise.reject(makeGeolocationError("GEOLOCATION_UNAVAILABLE"));
  }

  const {
    maxWaitMs = LOCATION_POLICY.accurateWatchMaxWaitMs,
    onProgress,
    signal,
    targetAccuracyMeters = LOCATION_POLICY.accurateWatchTargetMeters,
  } = options;

  return new Promise((resolve, reject) => {
    let bestMeasurement: BrowserLocationMeasurement | null = null;
    let settled = false;
    let watchId: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function cleanup() {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      if (timer !== null) {
        clearTimeout(timer);
      }

      signal?.removeEventListener("abort", handleAbort);
    }

    function finishWithMeasurement(measurement: BrowserLocationMeasurement) {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(measurement);
    }

    function fail(error: unknown) {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    }

    function handleAbort() {
      fail(makeGeolocationError("GEOLOCATION_ABORTED"));
    }

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener("abort", handleAbort, { once: true });

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const measurement = toBrowserLocationMeasurement(position);

        if (!isUsableLocationMeasurement(measurement)) {
          return;
        }

        onProgress?.(measurement);

        if (
          !bestMeasurement ||
          measurement.accuracy < bestMeasurement.accuracy
        ) {
          bestMeasurement = measurement;
        }

        if (measurement.accuracy <= targetAccuracyMeters) {
          finishWithMeasurement(measurement);
        }
      },
      (error) => {
        if (bestMeasurement) {
          finishWithMeasurement(bestMeasurement);
          return;
        }

        if (error.code === error.PERMISSION_DENIED) {
          fail(makeGeolocationError("GEOLOCATION_PERMISSION_DENIED"));
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          fail(makeGeolocationError("GEOLOCATION_POSITION_UNAVAILABLE"));
          return;
        }

        if (error.code === error.TIMEOUT) {
          fail(makeGeolocationError("GEOLOCATION_TIMEOUT"));
          return;
        }

        fail(makeGeolocationError("GEOLOCATION_FAILED"));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: maxWaitMs,
      },
    );

    timer = setTimeout(() => {
      if (bestMeasurement) {
        finishWithMeasurement(bestMeasurement);
        return;
      }

      fail(makeGeolocationError("GEOLOCATION_TIMEOUT"));
    }, maxWaitMs);
  });
}

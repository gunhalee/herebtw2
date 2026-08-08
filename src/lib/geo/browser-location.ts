import { LOCATION_POLICY } from "./location-policy";
import {
  assertBrowserGeolocationSupport,
  fromNativeGeolocationError,
  makeGeolocationError,
  toBrowserLocationError,
} from "./browser-location-support";

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
  improvementWaitMs?: number;
  maxWaitMs?: number;
  onProgress?: (measurement: BrowserLocationMeasurement) => void;
  signal?: AbortSignal;
  targetAccuracyMeters?: number;
};

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
  maximumAgeMs: number = LOCATION_POLICY.maximumMeasurementAgeMs,
) {
  const ageMs = Date.now() - measurement.measuredAt;

  return (
    Number.isFinite(measurement.latitude) &&
    measurement.latitude >= -90 &&
    measurement.latitude <= 90 &&
    Number.isFinite(measurement.longitude) &&
    measurement.longitude >= -180 &&
    measurement.longitude <= 180 &&
    Number.isFinite(measurement.accuracy) &&
    measurement.accuracy >= 0 &&
    ageMs >= 0 &&
    ageMs <= maximumAgeMs
  );
}

function assertUsableLocationMeasurement(
  measurement: BrowserLocationMeasurement,
  maximumAgeMs?: number,
) {
  if (!isUsableLocationMeasurement(measurement, maximumAgeMs)) {
    throw makeGeolocationError("GEOLOCATION_INVALID_POSITION");
  }

  return measurement;
}

export function getCurrentBrowserCoordinates(
  options: BrowserLocationRequestOptions = {},
): Promise<BrowserLocationMeasurement> {
  try {
    assertBrowserGeolocationSupport("current");
  } catch (error) {
    return Promise.reject(error);
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

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const measurement = assertUsableLocationMeasurement(
              toBrowserLocationMeasurement(position),
              maximumAgeMs,
            );
            finish(() => resolve(measurement));
          } catch (error) {
            finish(() => reject(toBrowserLocationError(error)));
          }
        },
        (error) => {
          finish(() => reject(fromNativeGeolocationError(error)));
        },
        {
          enableHighAccuracy,
          maximumAge: maximumAgeMs,
          timeout: timeoutMs,
        },
      );
    } catch (error) {
      finish(() => reject(toBrowserLocationError(error)));
    }
  });
}

export function getAccurateBrowserCoordinates(
  options: AccurateBrowserLocationRequestOptions = {},
): Promise<BrowserLocationMeasurement> {
  try {
    assertBrowserGeolocationSupport("current");
  } catch (error) {
    return Promise.reject(error);
  }

  const {
    improvementWaitMs = LOCATION_POLICY.accurateWatchImprovementWaitMs,
    maxWaitMs = LOCATION_POLICY.accurateWatchMaxWaitMs,
    onProgress,
    signal,
    targetAccuracyMeters = LOCATION_POLICY.accurateWatchTargetMeters,
  } = options;

  if (typeof navigator.geolocation.watchPosition !== "function") {
    return getCurrentBrowserCoordinates({
      enableHighAccuracy: true,
      maximumAgeMs: LOCATION_POLICY.maximumMeasurementAgeMs,
      signal,
      timeoutMs: maxWaitMs,
    });
  }

  return new Promise((resolve, reject) => {
    let bestMeasurement: BrowserLocationMeasurement | null = null;
    let settled = false;
    let watchId: number | null = null;
    let overallTimer: ReturnType<typeof setTimeout> | null = null;
    let improvementTimer: ReturnType<typeof setTimeout> | null = null;

    function cleanup() {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      if (overallTimer !== null) {
        clearTimeout(overallTimer);
      }

      if (improvementTimer !== null) {
        clearTimeout(improvementTimer);
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

    function finishWithBestMeasurementOrTimeout() {
      if (bestMeasurement) {
        finishWithMeasurement(bestMeasurement);
        return;
      }

      fail(makeGeolocationError("GEOLOCATION_TIMEOUT"));
    }

    try {
      const registeredWatchId = navigator.geolocation.watchPosition(
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
            return;
          }

          if (improvementTimer === null) {
            improvementTimer = setTimeout(
              finishWithBestMeasurementOrTimeout,
              improvementWaitMs,
            );
          }
        },
        (error) => {
          if (bestMeasurement) {
            finishWithMeasurement(bestMeasurement);
            return;
          }

          fail(fromNativeGeolocationError(error));
        },
        {
          enableHighAccuracy: true,
          maximumAge: LOCATION_POLICY.maximumMeasurementAgeMs,
          timeout: maxWaitMs,
        },
      );
      watchId = registeredWatchId;
    } catch (error) {
      fail(toBrowserLocationError(error));
      return;
    }

    if (settled) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      return;
    }

    overallTimer = setTimeout(finishWithBestMeasurementOrTimeout, maxWaitMs);
  });
}

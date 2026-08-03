type BrowserCoordinates = {
  latitude: number;
  longitude: number;
};

type BrowserLocationRequestOptions = {
  maximumAgeMs?: number;
  timeoutMs?: number;
};

function makeGeolocationError(code: string) {
  return new Error(code);
}

function canUseBrowserGeolocation() {
  return typeof window !== "undefined" && "geolocation" in navigator;
}

export function getCurrentBrowserCoordinates(
  options: BrowserLocationRequestOptions = {},
): Promise<BrowserCoordinates> {
  if (!canUseBrowserGeolocation()) {
    return Promise.reject(makeGeolocationError("GEOLOCATION_UNAVAILABLE"));
  }

  const { maximumAgeMs = 60000, timeoutMs = 10000 } = options;

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(makeGeolocationError("GEOLOCATION_PERMISSION_DENIED"));
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          reject(makeGeolocationError("GEOLOCATION_POSITION_UNAVAILABLE"));
          return;
        }

        if (error.code === error.TIMEOUT) {
          reject(makeGeolocationError("GEOLOCATION_TIMEOUT"));
          return;
        }

        reject(makeGeolocationError("GEOLOCATION_FAILED"));
      },
      {
        enableHighAccuracy: false,
        maximumAge: maximumAgeMs,
        timeout: timeoutMs,
      },
    );
  });
}

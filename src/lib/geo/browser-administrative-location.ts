import type { PostLocation } from "../../types/post";

const ADMINISTRATIVE_LOCATION_STORAGE_KEY =
  "herebtw.cachedAdministrativeLocation";
const ADMINISTRATIVE_LOCATION_CACHE_TTL_MS = 1000 * 60 * 30;

export type AdministrativeLocationSnapshot = {
  administrativeDongName: string;
  administrativeDongCode: string;
};

type CachedAdministrativeLocation = AdministrativeLocationSnapshot & {
  cacheKey: string;
  cachedAt: number;
};

function getAdministrativeLocationCacheKey(location: PostLocation) {
  return `${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`;
}

export function readCachedAdministrativeLocation(
  location: PostLocation,
): AdministrativeLocationSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(ADMINISTRATIVE_LOCATION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const cached = JSON.parse(raw) as Partial<CachedAdministrativeLocation>;

    if (
      cached.cacheKey !== getAdministrativeLocationCacheKey(location) ||
      typeof cached.cachedAt !== "number" ||
      Date.now() - cached.cachedAt > ADMINISTRATIVE_LOCATION_CACHE_TTL_MS ||
      typeof cached.administrativeDongName !== "string" ||
      typeof cached.administrativeDongCode !== "string"
    ) {
      return null;
    }

    return {
      administrativeDongName: cached.administrativeDongName,
      administrativeDongCode: cached.administrativeDongCode,
    };
  } catch {
    return null;
  }
}

export function writeCachedAdministrativeLocation(
  location: PostLocation,
  resolvedLocation: AdministrativeLocationSnapshot,
) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: CachedAdministrativeLocation = {
    cacheKey: getAdministrativeLocationCacheKey(location),
    cachedAt: Date.now(),
    administrativeDongName: resolvedLocation.administrativeDongName,
    administrativeDongCode: resolvedLocation.administrativeDongCode,
  };

  window.localStorage.setItem(
    ADMINISTRATIVE_LOCATION_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

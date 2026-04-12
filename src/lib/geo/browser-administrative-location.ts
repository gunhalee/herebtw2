import type { PostLocation } from "../../types/post";
import { quantizeLocationTo100MeterGrid } from "./location-buckets";

const ADMINISTRATIVE_LOCATION_STORAGE_KEY =
  "herebtw.cachedAdministrativeLocation";
const ADMINISTRATIVE_LOCATION_CACHE_TTL_MS = 1000 * 60 * 30;

export type AdministrativeLocationSnapshot = {
  administrativeDongName: string;
  administrativeDongCode: string;
  locationResolutionToken: string | null;
  locationResolutionTokenExpiresAt: number | null;
};

type CachedAdministrativeLocation = AdministrativeLocationSnapshot & {
  cacheKey: string;
  cachedAt: number;
};

function getAdministrativeLocationCacheKey(location: PostLocation) {
  const quantizedLocation = quantizeLocationTo100MeterGrid(location);

  return [
    quantizedLocation.latitudeBucket100m,
    quantizedLocation.longitudeBucket100m,
  ].join(":");
}

function normalizeCachedLocationResolutionToken(
  cached: Partial<CachedAdministrativeLocation>,
) {
  const token =
    typeof cached.locationResolutionToken === "string" &&
    cached.locationResolutionToken.trim()
      ? cached.locationResolutionToken
      : null;
  const expiresAt =
    typeof cached.locationResolutionTokenExpiresAt === "number" &&
    Number.isFinite(cached.locationResolutionTokenExpiresAt) &&
    cached.locationResolutionTokenExpiresAt > Date.now()
      ? cached.locationResolutionTokenExpiresAt
      : null;

  if (!token || !expiresAt) {
    return {
      locationResolutionToken: null,
      locationResolutionTokenExpiresAt: null,
    } as const;
  }

  return {
    locationResolutionToken: token,
    locationResolutionTokenExpiresAt: expiresAt,
  } as const;
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
    const currentCacheKey = getAdministrativeLocationCacheKey(location);

    if (
      cached.cacheKey !== currentCacheKey ||
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
      ...normalizeCachedLocationResolutionToken(cached),
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
    ...normalizeCachedLocationResolutionToken(resolvedLocation),
  };

  window.localStorage.setItem(
    ADMINISTRATIVE_LOCATION_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

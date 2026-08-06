import type { PostLocation } from "../../types/post";
import { quantizeLocationTo20MeterGrid } from "./location-buckets";
import { LOCATION_POLICY } from "./location-policy";

const ADMINISTRATIVE_LOCATION_STORAGE_KEY =
  "herebtw.cachedAdministrativeLocation.v2";
const ADMINISTRATIVE_LOCATION_CACHE_TTL_MS =
  LOCATION_POLICY.administrativeDisplayCacheMs;
const ADMINISTRATIVE_LOCATION_CACHE_SCHEMA_VERSION = 2;

export type AdministrativeLocationSnapshot = {
  administrativeDongName: string;
  administrativeDongCode: string;
  formattedAdministrativeAreaName: string;
  locationResolutionToken: string | null;
  locationResolutionTokenExpiresAt: number | null;
};

type CachedAdministrativeLocation = AdministrativeLocationSnapshot & {
  schemaVersion: typeof ADMINISTRATIVE_LOCATION_CACHE_SCHEMA_VERSION;
  provider: "kakao";
  cacheKey: string;
  cachedAt: number;
};

function getAdministrativeLocationCacheKey(location: PostLocation) {
  const quantizedLocation = quantizeLocationTo20MeterGrid(location);

  return [
    quantizedLocation.latitudeBucket20m,
    quantizedLocation.longitudeBucket20m,
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
      cached.schemaVersion !== ADMINISTRATIVE_LOCATION_CACHE_SCHEMA_VERSION ||
      cached.provider !== "kakao" ||
      typeof cached.cachedAt !== "number" ||
      Date.now() - cached.cachedAt > ADMINISTRATIVE_LOCATION_CACHE_TTL_MS ||
      typeof cached.administrativeDongName !== "string" ||
      typeof cached.administrativeDongCode !== "string" ||
      !/^\d{10}$/.test(cached.administrativeDongCode) ||
      typeof cached.formattedAdministrativeAreaName !== "string" ||
      !cached.formattedAdministrativeAreaName.trim()
    ) {
      return null;
    }

    return {
      administrativeDongName: cached.administrativeDongName,
      administrativeDongCode: cached.administrativeDongCode,
      formattedAdministrativeAreaName:
        cached.formattedAdministrativeAreaName,
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
    schemaVersion: ADMINISTRATIVE_LOCATION_CACHE_SCHEMA_VERSION,
    provider: "kakao",
    cacheKey: getAdministrativeLocationCacheKey(location),
    cachedAt: Date.now(),
    administrativeDongName: resolvedLocation.administrativeDongName,
    administrativeDongCode: resolvedLocation.administrativeDongCode,
    formattedAdministrativeAreaName:
      resolvedLocation.formattedAdministrativeAreaName,
    ...normalizeCachedLocationResolutionToken(resolvedLocation),
  };

  window.localStorage.setItem(
    ADMINISTRATIVE_LOCATION_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

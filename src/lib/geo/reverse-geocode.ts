import { unstable_cache } from "next/cache";
import { quantizeLocationTo20MeterGrid } from "./location-buckets";
import { LOCATION_POLICY } from "./location-policy";
import { fetchReverseGeocodeProviderPayload } from "./reverse-geocode-provider";
import {
  buildReverseGeocodeResult,
  type ReverseGeocodeResult,
} from "./reverse-geocode-result";

const REVERSE_GEOCODE_CACHE_REVALIDATE_SECONDS =
  LOCATION_POLICY.reverseGeocodeCacheSeconds;

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const quantizedLocation = quantizeLocationTo20MeterGrid({
    latitude,
    longitude,
  });

  return loadCachedReverseGeocode(
    quantizedLocation.latitudeBucket20m,
    quantizedLocation.longitudeBucket20m,
  );
}

async function loadReverseGeocode(input: {
  latitudeBucket20m: number;
  longitudeBucket20m: number;
}): Promise<ReverseGeocodeResult> {
  const startedAt = Date.now();
  const payload = await fetchReverseGeocodeProviderPayload(input);
  const result = buildReverseGeocodeResult(payload);

  console.info("[reverse-geocode] cache_miss", {
    latitudeBucket20m: input.latitudeBucket20m,
    longitudeBucket20m: input.longitudeBucket20m,
    durationMs: Date.now() - startedAt,
  });

  return result;
}

const loadCachedReverseGeocode = unstable_cache(
  async (latitudeBucket20m: number, longitudeBucket20m: number) =>
    loadReverseGeocode({
      latitudeBucket20m,
      longitudeBucket20m,
    }),
  ["reverse-geocode-20m-kakao-v1"],
  {
    revalidate: REVERSE_GEOCODE_CACHE_REVALIDATE_SECONDS,
    tags: ["reverse-geocode"],
  },
);

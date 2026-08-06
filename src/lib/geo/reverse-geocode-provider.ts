import { dequantizeLocationFrom20MeterGridBuckets } from "./location-buckets";
import { LocationResolutionError } from "./location-resolution-error";

type ReverseGeocodeProviderInput = {
  latitudeBucket20m: number;
  longitudeBucket20m: number;
};

type KakaoRegionDocument = {
  region_type?: string;
  address_name?: string;
  region_1depth_name?: string;
  region_2depth_name?: string;
  region_3depth_name?: string;
  code?: string;
};

type KakaoRegionResponse = {
  documents?: KakaoRegionDocument[];
};

export type ReverseGeocodeProviderPayload = {
  administrativeDongCandidateNames: Array<string | null | undefined>;
  directAdministrativeDongName: string | null;
  directAdministrativeDongCode: string | null;
  countryCode: string | null;
  overseasAdministrativeDongFallbackNames: Array<string | null | undefined>;
  sidoName: string | null;
  sigunguName: string | null;
};

const KAKAO_REVERSE_GEOCODE_ENDPOINT =
  "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json";
const REVERSE_GEOCODE_REQUEST_TIMEOUT_MS = 5000;

function requireKakaoRestApiKey() {
  const apiKey = process.env.KAKAO_REST_API_KEY?.trim();

  if (!apiKey) {
    throw new LocationResolutionError(
      "CONFIGURATION",
      "KAKAO_REST_API_KEY is required.",
    );
  }

  return apiKey;
}

function createReverseGeocodeUrl(input: ReverseGeocodeProviderInput) {
  const quantizedLocation = dequantizeLocationFrom20MeterGridBuckets(input);
  const url = new URL(KAKAO_REVERSE_GEOCODE_ENDPOINT);

  url.searchParams.set("x", String(quantizedLocation.longitude));
  url.searchParams.set("y", String(quantizedLocation.latitude));
  url.searchParams.set("input_coord", "WGS84");

  return url;
}

function buildReverseGeocodeProviderPayload(
  document: KakaoRegionDocument,
): ReverseGeocodeProviderPayload {
  const administrativeDongName = document.region_3depth_name?.trim() ?? "";
  const administrativeDongCode = document.code?.trim() ?? "";

  if (!administrativeDongName) {
    throw new LocationResolutionError(
      "INVALID_RESPONSE",
      "Kakao reverse geocoding returned no administrative dong.",
    );
  }

  if (!/^\d{10}$/.test(administrativeDongCode)) {
    throw new LocationResolutionError(
      "INVALID_RESPONSE",
      "Kakao reverse geocoding returned an invalid administrative dong code.",
    );
  }

  return {
    administrativeDongCandidateNames: [
      administrativeDongName,
      document.address_name,
    ],
    directAdministrativeDongName: administrativeDongName,
    directAdministrativeDongCode: administrativeDongCode,
    countryCode: "kr",
    overseasAdministrativeDongFallbackNames: [],
    sidoName: document.region_1depth_name?.trim() || null,
    sigunguName: document.region_2depth_name?.trim() || null,
  };
}

function createKakaoResponseError(status: number) {
  if (status === 401 || status === 403) {
    return new LocationResolutionError(
      "AUTHENTICATION",
      "Kakao reverse geocoding authentication failed.",
      { status },
    );
  }

  if (status === 429) {
    return new LocationResolutionError(
      "QUOTA",
      "Kakao reverse geocoding quota was exceeded.",
      { status },
    );
  }

  if (status >= 500) {
    return new LocationResolutionError(
      "UNAVAILABLE",
      "Kakao reverse geocoding is temporarily unavailable.",
      { status },
    );
  }

  return new LocationResolutionError(
    "UNAVAILABLE",
    `Kakao reverse geocoding failed with status ${status}.`,
    { status },
  );
}

export async function fetchReverseGeocodeProviderPayload(
  input: ReverseGeocodeProviderInput,
): Promise<ReverseGeocodeProviderPayload> {
  const apiKey = requireKakaoRestApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REVERSE_GEOCODE_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(createReverseGeocodeUrl(input), {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw createKakaoResponseError(response.status);
    }

    const json = (await response.json()) as KakaoRegionResponse;
    const administrativeRegion = Array.isArray(json.documents)
      ? json.documents.find((document) => document.region_type === "H")
      : null;

    if (!administrativeRegion) {
      throw new LocationResolutionError(
        "OUTSIDE_SERVICE_AREA",
        "Kakao reverse geocoding returned no administrative region.",
      );
    }

    return buildReverseGeocodeProviderPayload(administrativeRegion);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new LocationResolutionError(
        "TIMEOUT",
        "Kakao reverse geocoding timed out.",
        { cause: error },
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

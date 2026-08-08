import type { PostLocation } from "../../types/post";
import {
  formatAdministrativeAreaName,
  shortenSidoName,
} from "./format-administrative-area";
import { LocationResolutionError } from "./location-resolution-error";
import {
  createLocationResolutionTokenWithExpiry,
  type LocationScope,
} from "./location-resolution-token";

const KAKAO_ADDRESS_SEARCH_ENDPOINT =
  "https://dapi.kakao.com/v2/local/search/address.json";
const ADDRESS_SEARCH_REQUEST_TIMEOUT_MS = 5000;
const ADDRESS_SEARCH_RESULT_LIMIT = 30;

type KakaoAddress = {
  h_code?: string;
  region_1depth_name?: string;
  region_2depth_name?: string;
  region_3depth_h_name?: string;
};

type KakaoAddressDocument = {
  address_type?: string;
  address?: KakaoAddress | null;
  x?: string;
  y?: string;
};

type KakaoAddressSearchResponse = {
  documents?: KakaoAddressDocument[];
};

export type ManualAdministrativeLocationSelection = {
  administrativeAreaCode: string;
  administrativeAreaName: string;
  formattedAdministrativeAreaName: string;
  locationScope: LocationScope;
  location: PostLocation;
  locationResolutionToken: string;
  locationResolutionTokenExpiresAt: number;
};

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

function createAddressSearchUrl(query: string) {
  const url = new URL(KAKAO_ADDRESS_SEARCH_ENDPOINT);

  url.searchParams.set("query", query);
  url.searchParams.set("size", String(ADDRESS_SEARCH_RESULT_LIMIT));

  return url;
}

function createKakaoResponseError(status: number) {
  if (status === 401 || status === 403) {
    return new LocationResolutionError(
      "AUTHENTICATION",
      "Kakao address search authentication failed.",
      { status },
    );
  }

  if (status === 429) {
    return new LocationResolutionError(
      "QUOTA",
      "Kakao address search quota was exceeded.",
      { status },
    );
  }

  return new LocationResolutionError(
    "UNAVAILABLE",
    `Kakao address search failed with status ${status}.`,
    { status },
  );
}

function toSelection(
  document: KakaoAddressDocument,
): ManualAdministrativeLocationSelection | null {
  const address = document.address;
  const administrativeAreaCode = address?.h_code?.trim() ?? "";
  const administrativeDongName = address?.region_3depth_h_name?.trim() ?? "";
  const sigunguName = address?.region_2depth_name?.trim() ?? "";
  const sidoName = address?.region_1depth_name?.trim() ?? "";
  const longitude = Number(document.x);
  const latitude = Number(document.y);

  if (
    !/^\d{10}$/.test(administrativeAreaCode) ||
    (!administrativeDongName && document.address_type !== "REGION") ||
    (!administrativeDongName && !sigunguName && !sidoName) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const locationScope: LocationScope = administrativeDongName
    ? "dong"
    : sigunguName
      ? "district"
      : "province";
  const administrativeAreaName =
    administrativeDongName || sigunguName || shortenSidoName(sidoName) || sidoName;
  const location = { latitude, longitude };
  const formattedAdministrativeAreaName = administrativeDongName
    ? formatAdministrativeAreaName({
        sidoName,
        sigunguName,
        administrativeDongName,
      })
    : formatAdministrativeAreaName({
        sidoName,
        sigunguName,
        administrativeDongName: administrativeAreaName,
      });
  const token = createLocationResolutionTokenWithExpiry({
    administrativeDongCode: administrativeAreaCode,
    formattedAdministrativeAreaName,
    location,
    locationSource: "manual",
    locationScope,
  });

  return {
    administrativeAreaCode,
    administrativeAreaName,
    formattedAdministrativeAreaName,
    location,
    locationScope,
    locationResolutionToken: token.token,
    locationResolutionTokenExpiresAt: token.expiresAt,
  };
}

export function normalizeAdministrativeDongSearchQuery(query: unknown) {
  if (typeof query !== "string") {
    return null;
  }

  const normalized = query.trim().replace(/\s+/g, " ");

  if (normalized.length < 2 || normalized.length > 80) {
    return null;
  }

  return normalized;
}

export async function searchAdministrativeDongs(
  query: string,
): Promise<ManualAdministrativeLocationSelection[]> {
  const apiKey = requireKakaoRestApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    ADDRESS_SEARCH_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(createAddressSearchUrl(query), {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw createKakaoResponseError(response.status);
    }

    const json = (await response.json()) as KakaoAddressSearchResponse;
    const seenAreaCodes = new Set<string>();

    return (Array.isArray(json.documents) ? json.documents : [])
      .map(toSelection)
      .filter((selection): selection is ManualAdministrativeLocationSelection => {
        if (
          !selection ||
          seenAreaCodes.has(selection.administrativeAreaCode)
        ) {
          return false;
        }

        seenAreaCodes.add(selection.administrativeAreaCode);
        return true;
      });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new LocationResolutionError(
        "TIMEOUT",
        "Kakao address search timed out.",
        { cause: error },
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

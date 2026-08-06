import { reverseGeocode } from "./reverse-geocode";
import { LocationResolutionError } from "./location-resolution-error";

type CoordinateInput = {
  latitude: number;
  longitude: number;
};

type ResolvedLocation = CoordinateInput & {
  administrativeDongName: string;
  administrativeDongCode: string;
  sidoName: string | null;
  sigunguName: string | null;
  countryCode: string | null;
};

export function isWithinSouthKoreaServiceBounds(location: CoordinateInput) {
  return (
    location.latitude >= 33 &&
    location.latitude <= 39 &&
    location.longitude >= 124 &&
    location.longitude <= 132
  );
}

export function isValidCoordinateInput(
  location: CoordinateInput | null | undefined,
): location is CoordinateInput {
  if (!location) {
    return false;
  }

  return (
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

export async function resolveLocationFromCoordinates(
  location: CoordinateInput,
): Promise<ResolvedLocation> {
  if (!isValidCoordinateInput(location)) {
    throw new LocationResolutionError(
      "INVALID_COORDINATES",
      "Coordinates are invalid.",
    );
  }

  if (!isWithinSouthKoreaServiceBounds(location)) {
    throw new LocationResolutionError(
      "OUTSIDE_SERVICE_AREA",
      "Coordinates are outside the South Korea service area.",
    );
  }

  const geocodeResult = await reverseGeocode(
    location.latitude,
    location.longitude,
  );

  if (
    geocodeResult.countryCode?.toLowerCase() !== "kr" ||
    !/^\d{10}$/.test(geocodeResult.administrativeDongCode)
  ) {
    throw new LocationResolutionError(
      "OUTSIDE_SERVICE_AREA",
      "No South Korean administrative dong was found.",
    );
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    administrativeDongName: geocodeResult.administrativeDongName,
    administrativeDongCode: geocodeResult.administrativeDongCode,
    sidoName: geocodeResult.sidoName,
    sigunguName: geocodeResult.sigunguName,
    countryCode: geocodeResult.countryCode,
  };
}

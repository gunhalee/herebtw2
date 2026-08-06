import { readJsonBody } from "../../../../lib/api/request";
import { fail, ok } from "../../../../lib/api/response";
import { formatAdministrativeAreaName } from "../../../../lib/geo/format-administrative-area";
import { isLocationResolutionError } from "../../../../lib/geo/location-resolution-error";
import { createLocationResolutionTokenWithExpiry } from "../../../../lib/geo/location-resolution-token";
import {
  isValidCoordinateInput,
  resolveLocationFromCoordinates,
} from "../../../../lib/geo/resolve-location";

type ResolveLocationRequest = {
  location?: {
    latitude: number;
    longitude: number;
  };
};

export async function POST(request: Request) {
  const startedAt = Date.now();
  const bodyResult = await readJsonBody<ResolveLocationRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const { location } = bodyResult.body;

  if (!isValidCoordinateInput(location)) {
    return fail(
      {
        code: "INVALID_LOCATION",
        message: "유효한 위치 좌표가 필요해요.",
      },
      400,
    );
  }

  try {
    const resolvedLocation = await resolveLocationFromCoordinates(location);
    const formattedAdministrativeAreaName = formatAdministrativeAreaName({
      sidoName: resolvedLocation.sidoName,
      sigunguName: resolvedLocation.sigunguName,
      administrativeDongName: resolvedLocation.administrativeDongName,
    });
    const locationResolutionToken = createLocationResolutionTokenWithExpiry({
      administrativeDongCode: resolvedLocation.administrativeDongCode,
      formattedAdministrativeAreaName,
      location,
    });

    console.info("[location.resolve]", {
      durationMs: Date.now() - startedAt,
      outcome: "success",
      provider: "kakao",
    });

    return ok({
      location: {
        ...resolvedLocation,
        formattedAdministrativeAreaName,
        locationResolutionToken: locationResolutionToken.token,
        locationResolutionTokenExpiresAt: locationResolutionToken.expiresAt,
      },
    });
  } catch (error) {
    const resolutionCode = isLocationResolutionError(error)
      ? error.code
      : "UNAVAILABLE";
    const response =
      resolutionCode === "INVALID_COORDINATES"
        ? {
            code: "INVALID_LOCATION",
            message: "유효한 위치 좌표가 필요해요.",
            status: 400,
          }
        : resolutionCode === "OUTSIDE_SERVICE_AREA"
          ? {
              code: "LOCATION_OUTSIDE_SERVICE_AREA",
              message: "현재 위치에서는 동네를 확인할 수 없어요.",
              status: 422,
            }
          : resolutionCode === "TIMEOUT"
            ? {
                code: "LOCATION_SERVICE_TIMEOUT",
                message: "위치 확인이 지연되고 있어요. 다시 시도해 주세요.",
                status: 504,
              }
            : resolutionCode === "QUOTA"
              ? {
                  code: "LOCATION_SERVICE_BUSY",
                  message: "위치 확인 요청이 많아요. 잠시 후 다시 시도해 주세요.",
                  status: 503,
                }
              : {
                  code: "LOCATION_RESOLUTION_FAILED",
                  message: "현재 위치를 확인하지 못했어요.",
                  status:
                    resolutionCode === "CONFIGURATION" ||
                    resolutionCode === "AUTHENTICATION"
                      ? 503
                      : 502,
                };

    console.error("[location.resolve]", {
      durationMs: Date.now() - startedAt,
      outcome: "failure",
      provider: "kakao",
      reason: resolutionCode,
      upstreamStatus: isLocationResolutionError(error)
        ? error.status
        : null,
    });

    return fail(
      {
        code: response.code,
        message: response.message,
      },
      response.status,
    );
  }
}

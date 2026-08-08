import { readJsonBody } from "../../../lib/api/request";
import { fail, ok } from "../../../lib/api/response";
import { formatAdministrativeAreaName } from "../../../lib/geo/format-administrative-area";
import { verifyLocationResolutionToken } from "../../../lib/geo/location-resolution-token";
import {
  isValidCoordinateInput,
  resolveLocationFromCoordinates,
} from "../../../lib/geo/resolve-location";
import { createPost } from "../../../lib/posts/mutations";
import type { LocationSource } from "../../../lib/geo/location-resolution-token";

type CreatePostRequest = {
  anonymousDeviceId?: string;
  content?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  locationResolutionToken?: string | null;
  locationSource?: LocationSource;
  notificationEmail?: string;
};

async function resolveAdministrativeLocationForPost(input: {
  location: {
    latitude: number;
    longitude: number;
  };
  locationResolutionToken?: string | null;
  locationSource?: LocationSource;
}) {
  const verifiedLocation = verifyLocationResolutionToken(
    input.locationResolutionToken,
    input.location,
  );

  if (verifiedLocation) {
    if (
      input.locationSource === "manual" &&
      verifiedLocation.locationSource !== "manual"
    ) {
      throw new Error("INVALID_MANUAL_LOCATION_SELECTION");
    }

    return verifiedLocation;
  }

  if (input.locationSource === "manual") {
    throw new Error("INVALID_MANUAL_LOCATION_SELECTION");
  }

  const resolvedLocation = await resolveLocationFromCoordinates(input.location);

  return {
    administrativeDongCode: resolvedLocation.administrativeDongCode,
    formattedAdministrativeAreaName: formatAdministrativeAreaName({
      sidoName: resolvedLocation.sidoName,
      sigunguName: resolvedLocation.sigunguName,
      administrativeDongName: resolvedLocation.administrativeDongName,
    }),
    locationScope: "dong" as const,
    locationSource: "browser" as const,
  };
}

export async function POST(request: Request) {
  const bodyResult = await readJsonBody<CreatePostRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const body = bodyResult.body;

  if (!body.anonymousDeviceId?.trim()) {
    return fail(
      {
        code: "INVALID_DEVICE_ID",
        message: "anonymousDeviceId가 필요합니다.",
      },
      400,
    );
  }

  if (!isValidCoordinateInput(body.location)) {
    return fail(
      {
        code: "INVALID_LOCATION",
        message: "유효한 위치 좌표가 필요해요.",
      },
      400,
    );
  }

  let resolvedAdministrativeLocation;

  try {
    resolvedAdministrativeLocation = await resolveAdministrativeLocationForPost(
      {
        location: body.location,
        locationResolutionToken: body.locationResolutionToken,
        locationSource: body.locationSource,
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_MANUAL_LOCATION_SELECTION"
    ) {
      return fail(
        {
          code: "INVALID_LOCATION_SELECTION",
          message: "선택한 지역이 만료되었습니다. 지역을 다시 선택해 주세요.",
        },
        400,
      );
    }

    return fail(
      {
        code: "LOCATION_RESOLUTION_FAILED",
        message: "현재 위치를 확인하지 못했어요.",
      },
      502,
    );
  }

  const result = await createPost({
    anonymousDeviceId: body.anonymousDeviceId,
    content: body.content ?? "",
    location: body.location,
    resolvedDongCode: resolvedAdministrativeLocation.administrativeDongCode,
    resolvedDongName:
      resolvedAdministrativeLocation.formattedAdministrativeAreaName,
    locationScope: resolvedAdministrativeLocation.locationScope,
    locationSource: resolvedAdministrativeLocation.locationSource,
    notificationEmail: body.notificationEmail?.trim() || undefined,
  });

  if (!result.ok) {
    return fail(
      {
        code: result.code,
        message: result.message,
      },
      400,
    );
  }

  return ok({
    post: result.post,
  });
}

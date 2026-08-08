import { readJsonBody } from "../../../../lib/api/request";
import { fail, ok } from "../../../../lib/api/response";
import {
  normalizeAdministrativeDongSearchQuery,
  searchAdministrativeDongs,
} from "../../../../lib/geo/administrative-dong-search";
import { isLocationResolutionError } from "../../../../lib/geo/location-resolution-error";

type SearchLocationRequest = {
  query?: string;
};

export async function POST(request: Request) {
  const bodyResult = await readJsonBody<SearchLocationRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const query = normalizeAdministrativeDongSearchQuery(bodyResult.body.query);

  if (!query) {
    return fail(
      {
        code: "INVALID_LOCATION_QUERY",
        message: "동네 이름을 두 글자 이상 입력해 주세요.",
      },
      400,
    );
  }

  try {
    const locations = await searchAdministrativeDongs(query);

    return ok({ locations });
  } catch (error) {
    const code = isLocationResolutionError(error) ? error.code : "UNAVAILABLE";

    console.error("[location.search]", {
      outcome: "failure",
      provider: "kakao",
      reason: code,
    });

    return fail(
      {
        code: "LOCATION_SEARCH_FAILED",
        message:
          code === "TIMEOUT"
            ? "동네 검색이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
            : "동네를 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      code === "TIMEOUT" ? 504 : 502,
    );
  }
}

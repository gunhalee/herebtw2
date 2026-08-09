import { fail, ok } from "../../../../../lib/api/response";
import { getVerifiedAuthClaims } from "../../../../../lib/auth/candidate-session";
import {
  decodeCandidateDashboardCursor,
  encodeCandidateDashboardCursor,
} from "../../../../../lib/candidate-dashboard/cursor";
import {
  isCandidateInboxReadEnabled,
  isCandidateMfaRequired,
} from "../../../../../lib/candidate-dashboard/feature-flags";
import { loadCandidateDashboardBootstrapV2 } from "../../../../../lib/candidate-dashboard/repository";
import type { CandidateDashboardFilter } from "../../../../../lib/candidate-dashboard/types";
import { createCandidateRequestTiming } from "../../../../../lib/candidate-dashboard/timing";

export async function GET(request: Request) {
  const timing = createCandidateRequestTiming("candidate.dashboard.page");
  function finishResponse(response: Response, status: string) {
    const result = timing.finish(status);
    response.headers.set("Server-Timing", result.serverTiming);
    response.headers.set("X-Request-Id", result.requestId);
    return response;
  }
  if (!isCandidateInboxReadEnabled()) {
    return finishResponse(
      fail({ code: "NOT_AVAILABLE", message: "새 목록 경로가 아직 활성화되지 않았습니다." }, 404),
      "disabled",
    );
  }
  const claims = await getVerifiedAuthClaims();
  timing.mark("auth");
  if (!claims) {
    return finishResponse(
      fail({ code: "UNAUTHORIZED", message: "인증이 필요합니다." }, 401),
      "unauthorized",
    );
  }
  if (isCandidateMfaRequired() && claims.assuranceLevel !== "aal2") {
    return finishResponse(
      fail({ code: "MFA_REQUIRED", message: "추가 인증이 필요합니다." }, 403),
      "mfa_required",
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const filter: CandidateDashboardFilter = searchParams.get("filter") === "mine" ? "mine" : "open";
  const encodedCursor = searchParams.get("cursor") ?? "";
  const cursor = decodeCandidateDashboardCursor(encodedCursor, filter);
  if (!cursor) {
    return finishResponse(
      fail({ code: "INVALID_CURSOR", message: "목록 위치가 올바르지 않습니다." }, 400),
      "invalid_cursor",
    );
  }

  const result = await loadCandidateDashboardBootstrapV2({
    authUserId: claims.authUserId,
    filter,
    cursor,
    limit: 20,
  });
  timing.mark("bootstrap");
  if (!result || result.status !== "ok") {
    return finishResponse(
      fail({ code: "DASHBOARD_UNAVAILABLE", message: "목록을 불러오지 못했습니다." }, 503),
      "unavailable",
    );
  }
  return finishResponse(ok(
    {
      items: result.items ?? [],
      nextCursor: encodeCandidateDashboardCursor(filter, result.nextCursorParts),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  ), "ok");
}

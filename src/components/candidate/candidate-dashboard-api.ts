import { fetchClientApiData } from "../../lib/api/client";
import type { CandidateDashboardFilter } from "../../lib/candidate-dashboard/types";
import type { DashboardPost } from "./candidate-dashboard-types";

export function fetchCandidateDashboardPage(input: {
  cursor: string;
  filter: CandidateDashboardFilter;
}) {
  const search = new URLSearchParams({ cursor: input.cursor, filter: input.filter });
  return fetchClientApiData<{ items: DashboardPost[]; nextCursor: string | null }>({
    errorMessage: "글을 더 불러오지 못했습니다.",
    path: `/api/candidate/dashboard/posts?${search}`,
    timeoutErrorMessage: "목록 요청이 지연되고 있어요. 다시 시도해 주세요.",
  });
}

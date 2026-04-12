import { fetchClientApiData } from "../../lib/api/client";
import type { PostListState } from "../../types/post";

const DEFAULT_REPLIES_PAGE_LIMIT = 10;

type CandidateRepliesResponse = {
  items: PostListState["items"];
  nextCursor: string | null;
};

function createCandidateRepliesSearchParams(input: {
  cursor?: string | null;
  limit: number;
}) {
  const params = new URLSearchParams({
    limit: String(input.limit),
  });

  if (input.cursor) {
    params.set("cursor", input.cursor);
  }

  return params;
}

export async function fetchCandidateRepliesPage(
  candidateId: string,
  cursor?: string | null,
  limit = DEFAULT_REPLIES_PAGE_LIMIT,
) {
  return fetchClientApiData<CandidateRepliesResponse>({
    errorMessage:
      "\uD6C4\uBCF4 \uB2F5\uBCC0 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
    path: `/api/candidates/${candidateId}/replies?${createCandidateRepliesSearchParams({
      cursor,
      limit,
    }).toString()}`,
  });
}

import {
  createJsonPostRequestInit,
  fetchClientApiData,
} from "../../lib/api/client";

type CreateCandidateReplyInput = {
  postId: string;
  content: string;
  isPromise: boolean;
  promiseDeadline: string | null;
};

type CreateCandidateReplyResponse = {
  reply: {
    id: string;
    post_id: string;
    candidate_id: string;
    content: string;
    is_promise: boolean;
    promise_deadline: string | null;
    created_at: string;
  };
};

export async function createCandidateReply(input: CreateCandidateReplyInput) {
  return fetchClientApiData<CreateCandidateReplyResponse>({
    errorMessage: "답변 등록에 실패했습니다.",
    init: createJsonPostRequestInit(input),
    path: "/api/candidate/replies",
    timeoutErrorMessage:
      "답변 등록이 지연되고 있어요. 다시 시도해 주세요.",
  });
}

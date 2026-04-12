import {
  createJsonPatchRequestInit,
  createJsonPostRequestInit,
  fetchClientApiData,
} from "../../lib/api/client";

type CreateCandidateFirstMessageInput = {
  content: string;
};

type UpdateCandidateFirstMessageInput = {
  content: string;
};

type CreateCandidateFirstMessageResponse = {
  post: {
    id: string;
    public_uuid: string;
    created_at: string;
  };
};

type UpdateCandidateFirstMessageResponse = {
  content: string;
};

export async function createCandidateFirstMessage(
  input: CreateCandidateFirstMessageInput,
) {
  return fetchClientApiData<CreateCandidateFirstMessageResponse>({
    errorMessage: "첫 마디를 등록하지 못했습니다.",
    init: createJsonPostRequestInit(input),
    path: "/api/candidate/first-message",
    timeoutErrorMessage:
      "첫 마디 등록이 지연되고 있어요. 다시 시도해 주세요.",
  });
}

export async function updateCandidateFirstMessage(
  input: UpdateCandidateFirstMessageInput,
) {
  return fetchClientApiData<UpdateCandidateFirstMessageResponse>({
    errorMessage: "저장에 실패했습니다. 다시 시도해 주세요.",
    init: createJsonPatchRequestInit(input),
    path: "/api/candidate/first-message",
    timeoutErrorMessage:
      "저장 요청이 지연되고 있어요. 다시 시도해 주세요.",
  });
}

import { fetchClientApiData } from "../../lib/api/client";
import type {
  CandidateMessage,
  UserDistricts,
} from "../../lib/candidates/messages";

type CandidateMessagesResponse = {
  candidates: CandidateMessage[];
  userDistricts: UserDistricts;
};

function createCandidateMessagesPath(dongCode: string | null) {
  if (!dongCode) {
    return "/api/candidates/messages";
  }

  return `/api/candidates/messages?dongCode=${encodeURIComponent(dongCode)}`;
}

export async function fetchCandidateMessages(dongCode: string | null) {
  return fetchClientApiData<CandidateMessagesResponse>({
    errorMessage: "후보 메시지를 불러오지 못했습니다.",
    path: createCandidateMessagesPath(dongCode),
    timeoutErrorMessage:
      "후보 메시지 로딩이 지연되고 있어요. 다시 시도해 주세요.",
  });
}

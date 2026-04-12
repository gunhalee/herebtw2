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
    errorMessage: "후보의 한마디를 불러오지 못했습니다. 새로고침을 해주세요.",
    path: createCandidateMessagesPath(dongCode),
    timeoutErrorMessage:
      "후보의 한마디 로딩이 지연되고 있어요. 새로고침을 해주세요.",
  });
}

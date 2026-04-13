import type { CandidateMessage } from "./messages";
import type { CandidateRow } from "../posts/repository/types";
import { findCandidateById, loadFirstMessage } from "../posts/repository";

type CandidateReplyHeaderCardSource = Pick<
  CandidateRow,
  | "id"
  | "name"
  | "district"
  | "photo_url"
  | "first_message_id"
  | "metro_council_district"
  | "local_council_district"
  | "council_type"
>;

export async function loadCandidateReplyHeaderCardForCandidate(
  candidate: CandidateReplyHeaderCardSource | null,
): Promise<CandidateMessage | null> {
  if (!candidate?.first_message_id) {
    return null;
  }

  const firstMessage = await loadFirstMessage(candidate.first_message_id);

  if (!firstMessage) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    district: candidate.district,
    photoUrl: candidate.photo_url ?? null,
    firstMessageContent: firstMessage.content,
    firstMessagePublicUuid: firstMessage.public_uuid,
    metroCouncilDistrict: candidate.metro_council_district ?? null,
    localCouncilDistrict: candidate.local_council_district ?? null,
    councilType: candidate.council_type ?? null,
    matchType: "other",
  };
}

export async function loadCandidateReplyHeaderCard(
  candidateId: string,
): Promise<CandidateMessage | null> {
  const candidate = await findCandidateById(candidateId);
  return loadCandidateReplyHeaderCardForCandidate(candidate);
}

import { createClient } from "../server";
import { findCandidateByAuthUserId } from "../posts/repository";

export type CandidateSession = {
  authUserId: string;
  candidateId: string;
  name: string;
  district: string;
  isActive: boolean;
  hasFirstMessage: boolean;
};

export async function getCandidateSession(): Promise<CandidateSession | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data?.user) {
      return null;
    }

    const candidate = await findCandidateByAuthUserId(data.user.id);

    if (!candidate) {
      return null;
    }

    return {
      authUserId: data.user.id,
      candidateId: candidate.id,
      name: candidate.name,
      district: candidate.district,
      isActive: candidate.is_active,
      hasFirstMessage: candidate.first_message_id !== null,
    };
  } catch {
    return null;
  }
}

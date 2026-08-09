import { createClient } from "../server";
import { findCandidateByAuthUserId } from "../posts/repository";

export type CandidateSession = {
  authUserId: string;
  candidateId: string;
  name: string;
  district: string;
  isActive: boolean;
  hasFirstMessage: boolean;
  hasPendingFirstMessage: boolean;
  firstMessageId: string | null;
  assuranceLevel: string | null;
};

export type VerifiedAuthClaims = {
  authUserId: string;
  assuranceLevel: string | null;
};

export async function getVerifiedAuthClaims(): Promise<VerifiedAuthClaims | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const authUserId = data?.claims?.sub;

    if (error || typeof authUserId !== "string") {
      return null;
    }

    return {
      authUserId,
      assuranceLevel:
        typeof data?.claims?.aal === "string" ? data.claims.aal : null,
    };
  } catch {
    return null;
  }
}

export async function getCandidateSession(): Promise<CandidateSession | null> {
  try {
    const claims = await getVerifiedAuthClaims();
    if (!claims) {
      return null;
    }

    const candidate = await findCandidateByAuthUserId(claims.authUserId);

    if (!candidate) {
      return null;
    }

    return {
      authUserId: claims.authUserId,
      candidateId: candidate.id,
      name: candidate.name,
      district: candidate.district,
      isActive: candidate.is_active,
      hasFirstMessage: candidate.first_message_id !== null,
      hasPendingFirstMessage: candidate.pending_first_message_id != null,
      firstMessageId: candidate.first_message_id ?? null,
      assuranceLevel: claims.assuranceLevel,
    };
  } catch {
    return null;
  }
}

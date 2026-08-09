import { randomUUID } from "node:crypto";
import { evaluateModerationContent } from "../moderation/decision-engine";
import { encryptModerationEvidence } from "../moderation/evidence-crypto";
import {
  attachCandidateFirstMessageRepository,
  createCandidateFirstMessageRepository,
  createCandidateFirstMessageUpdateCaseRepository,
  createCandidateQuarantinedFirstMessageRepository,
  loadCandidateDistrictRepository,
  updateCandidateFirstMessageRepository,
} from "../posts/repository";

type CreateCandidateFirstMessageInput = {
  candidateId: string;
  content: string;
};

type CreateCandidateFirstMessageResult =
  | {
      ok: true;
      post: {
        id: string;
        public_uuid: string;
        created_at: string;
      };
      publicationStatus: "published" | "under_review";
    }
  | {
      ok: false;
      code: "CREATE_FAILED" | "NOT_FOUND" | "UNSAFE_CONTENT";
      message: string;
    };

type UpdateCandidateFirstMessageInput = {
  content: string;
  postId: string;
};

export async function updateCandidateFirstMessage(
  input: UpdateCandidateFirstMessageInput,
) {
  const moderation = evaluateModerationContent({
    content: input.content,
    profile: "candidate_first_message",
  });
  if (moderation.action === "block") {
    return { ok: false as const, code: "UNSAFE_CONTENT" as const, message: moderation.message! };
  }
  if (moderation.action === "quarantine") {
    const casePublicId = randomUUID();
    const evidence = encryptModerationEvidence({
      casePublicId,
      content: input.content,
      policyVersion: moderation.policyVersion,
    });
    await createCandidateFirstMessageUpdateCaseRepository({
      ...evidence,
      casePublicId,
      contentHmac: moderation.contentDecisionKey,
      normalizationVersion: moderation.normalizationVersion,
      policyVersion: moderation.policyVersion,
      postId: input.postId,
      priority: moderation.priority,
      reasonCodes: moderation.reasonCodes,
      riskBand: moderation.riskBand === "low" ? "medium" : moderation.riskBand,
    });
    return { ok: true as const, publicationStatus: "under_review" as const };
  }
  await updateCandidateFirstMessageRepository(input.postId, input.content);
  return { ok: true as const, publicationStatus: "published" as const };
}

export async function createCandidateFirstMessage(
  input: CreateCandidateFirstMessageInput,
): Promise<CreateCandidateFirstMessageResult> {
  const candidate = await loadCandidateDistrictRepository(input.candidateId);

  if (!candidate) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "후보 정보를 찾을 수 없습니다.",
    };
  }

  const moderation = evaluateModerationContent({
    content: input.content,
    profile: "candidate_first_message",
  });

  if (moderation.action === "block") {
    return {
      ok: false,
      code: "UNSAFE_CONTENT",
      message: moderation.message ?? "게시할 수 없는 내용이 포함되어 있어요.",
    };
  }

  if (moderation.action === "quarantine") {
    const casePublicId = randomUUID();
    const evidence = encryptModerationEvidence({
      casePublicId,
      content: input.content,
      policyVersion: moderation.policyVersion,
    });
    const quarantinedPost = await createCandidateQuarantinedFirstMessageRepository({
      ...evidence,
      candidateId: input.candidateId,
      casePublicId,
      contentHmac: moderation.contentDecisionKey,
      district: candidate.district,
      normalizationVersion: moderation.normalizationVersion,
      policyVersion: moderation.policyVersion,
      priority: moderation.priority,
      reasonCodes: moderation.reasonCodes,
      riskBand: moderation.riskBand === "low" ? "medium" : moderation.riskBand,
    });
    if (!quarantinedPost) {
      return { ok: false, code: "CREATE_FAILED", message: "첫 마디를 검수 목록에 등록하지 못했습니다." };
    }
    return {
      ok: true,
      post: {
        id: quarantinedPost.post_id,
        public_uuid: quarantinedPost.post_public_uuid,
        created_at: quarantinedPost.post_created_at,
      },
      publicationStatus: "under_review",
    };
  }

  const post = await createCandidateFirstMessageRepository({
    candidateId: input.candidateId,
    district: candidate.district,
    content: input.content,
  });

  if (!post) {
    return {
      ok: false,
      code: "CREATE_FAILED",
      message: "첫 마디를 등록하지 못했습니다.",
    };
  }

  await attachCandidateFirstMessageRepository(input.candidateId, post.id);

  return {
    ok: true,
    post,
    publicationStatus: "published",
  };
}

import { randomUUID } from "node:crypto";
import {
  createReportModerationCaseRepository,
  loadPostForReportModerationRepository,
} from "../posts/repository";
import { evaluateModerationContent } from "./decision-engine";
import { encryptModerationEvidence } from "./evidence-crypto";

export async function ensureReportedPostModerationCase(input: {
  postId: string;
  reasonCode: string;
}) {
  const reportedPost = await loadPostForReportModerationRepository(input.postId);
  if (!reportedPost) return;
  const casePublicId = randomUUID();
  const moderation = evaluateModerationContent({
    content: reportedPost.content,
    profile: "citizen_post",
  });
  const evidence = encryptModerationEvidence({
    casePublicId,
    content: reportedPost.content,
    policyVersion: moderation.policyVersion,
  });
  await createReportModerationCaseRepository({
    ...evidence,
    casePublicId,
    contentHmac: moderation.contentDecisionKey,
    normalizationVersion: moderation.normalizationVersion,
    policyVersion: moderation.policyVersion,
    postId: input.postId,
    reportReasonCode: input.reasonCode,
  });
}

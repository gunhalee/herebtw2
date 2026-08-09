import { readJsonBody } from "../../../../lib/api/request";
import { fail, ok } from "../../../../lib/api/response";
import { getCandidateSession } from "../../../../lib/auth/candidate-session";
import { getAccountRateLimitResponse } from "../../../../lib/abuse/account-guard";
import { ABUSE_POLICY } from "../../../../lib/abuse/policy";
import { isCandidateMfaRequired } from "../../../../lib/candidate-dashboard/feature-flags";
import { loadFirstMessage } from "../../../../lib/posts/repository";
import {
  createCandidateFirstMessage,
  updateCandidateFirstMessage,
} from "../../../../lib/candidates/mutations";

type UpdateFirstMessageRequest = {
  content: string;
};

export async function PATCH(request: Request) {
  const session = await getCandidateSession();

  if (!session) {
    return fail({ code: "UNAUTHORIZED", message: "인증이 필요합니다." }, 401);
  }

  if (!session.isActive) {
    return fail({ code: "CANDIDATE_INACTIVE", message: "활성화된 후보자만 작성할 수 있습니다." }, 403);
  }

  if (isCandidateMfaRequired() && session.assuranceLevel !== "aal2") {
    return fail({ code: "MFA_REQUIRED", message: "수정하려면 추가 인증이 필요합니다." }, 403);
  }

  const rateLimitResponse = await getAccountRateLimitResponse({
    accountId: session.authUserId,
    action: "candidate.first_message",
    budgets: ABUSE_POLICY.candidateWrite.accountBudgets,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (!session.firstMessageId) {
    return fail({ code: "NOT_FOUND", message: "첫 메시지가 없습니다." }, 404);
  }

  const bodyResult = await readJsonBody<UpdateFirstMessageRequest>(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const trimmedContent = bodyResult.body.content?.trim() ?? "";

  if (trimmedContent.length < 1 || trimmedContent.length > 100) {
    return fail(
      { code: "VALIDATION_ERROR", message: "내용은 1~100자여야 합니다." },
      400,
    );
  }

  const currentFirstMessage = await loadFirstMessage(session.firstMessageId);
  if (currentFirstMessage?.content.trim() === trimmedContent) {
    return ok(
      {
        changed: false,
        content: currentFirstMessage.content,
        publicationStatus: "published" as const,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const updateResult = await updateCandidateFirstMessage({
    postId: session.firstMessageId,
    content: trimmedContent,
  });

  if (!updateResult.ok) {
    return fail({ code: updateResult.code, message: updateResult.message }, 422);
  }

  return ok(
    {
      changed: true,
      content: updateResult.publicationStatus === "published" ? trimmedContent : null,
      publicationStatus: updateResult.publicationStatus,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

type FirstMessageRequest = {
  content: string;
};

export async function POST(request: Request) {
  const session = await getCandidateSession();

  if (!session) {
    return fail({ code: "UNAUTHORIZED", message: "인증이 필요합니다." }, 401);
  }

  if (!session.isActive) {
    return fail({ code: "CANDIDATE_INACTIVE", message: "활성화된 후보자만 작성할 수 있습니다." }, 403);
  }

  if (isCandidateMfaRequired() && session.assuranceLevel !== "aal2") {
    return fail({ code: "MFA_REQUIRED", message: "등록하려면 추가 인증이 필요합니다." }, 403);
  }

  const rateLimitResponse = await getAccountRateLimitResponse({
    accountId: session.authUserId,
    action: "candidate.first_message",
    budgets: ABUSE_POLICY.candidateWrite.accountBudgets,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (session.hasFirstMessage || session.hasPendingFirstMessage) {
    return fail(
      { code: "ALREADY_EXISTS", message: "이미 첫 메시지를 작성했습니다." },
      400,
    );
  }

  const bodyResult = await readJsonBody<FirstMessageRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const trimmedContent = bodyResult.body.content?.trim() ?? "";

  if (trimmedContent.length < 1 || trimmedContent.length > 100) {
    return fail(
      { code: "VALIDATION_ERROR", message: "내용은 1~100자여야 합니다." },
      400,
    );
  }

  const result = await createCandidateFirstMessage({
    candidateId: session.candidateId,
    content: trimmedContent,
  });

  if (!result.ok) {
    return fail(
      { code: result.code, message: result.message },
      result.code === "NOT_FOUND" ? 404 : result.code === "UNSAFE_CONTENT" ? 422 : 500,
    );
  }

  return ok(
    { post: result.post, publicationStatus: result.publicationStatus },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

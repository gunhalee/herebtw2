import { randomUUID } from "node:crypto";
import { fail, ok } from "../../../../lib/api/response";
import { readJsonBody } from "../../../../lib/api/request";
import { getCandidateSession } from "../../../../lib/auth/candidate-session";
import { getAccountRateLimitResponse } from "../../../../lib/abuse/account-guard";
import { ABUSE_POLICY } from "../../../../lib/abuse/policy";
import { createCandidateReply } from "../../../../lib/candidates/reply-mutation";
import {
  isCandidateAtomicReplyEnabled,
  isCandidateMfaRequired,
} from "../../../../lib/candidate-dashboard/feature-flags";
import { createCandidateRequestTiming } from "../../../../lib/candidate-dashboard/timing";
import {
  isCandidateReplyLengthValid,
} from "../../../../lib/candidate-replies/policy";

type CreateReplyRequest = {
  clientRequestId?: string;
  postId: string;
  content: string;
  isPromise: boolean;
  promiseDeadline: string | null;
};

export async function POST(request: Request) {
  const timing = createCandidateRequestTiming("candidate.reply");
  function finishResponse(response: Response, status: string) {
    const result = timing.finish(status);
    response.headers.set("Server-Timing", result.serverTiming);
    response.headers.set("X-Request-Id", result.requestId);
    return response;
  }
  const session = await getCandidateSession();
  timing.mark("auth_candidate");

  if (!session) {
    return finishResponse(
      fail({ code: "UNAUTHORIZED", message: "인증이 필요합니다." }, 401),
      "unauthorized",
    );
  }

  if (!session.isActive) {
    return finishResponse(
      fail({ code: "CANDIDATE_INACTIVE", message: "활성화된 후보자만 답변할 수 있습니다." }, 403),
      "candidate_inactive",
    );
  }

  if (isCandidateMfaRequired() && session.assuranceLevel !== "aal2") {
    return finishResponse(
      fail(
        { code: "MFA_REQUIRED", message: "답변하려면 추가 인증이 필요합니다." },
        403,
      ),
      "mfa_required",
    );
  }

  const rateLimitResponse = await getAccountRateLimitResponse({
    accountId: session.authUserId,
    action: "candidate.reply",
    budgets: ABUSE_POLICY.candidateWrite.accountBudgets,
  });

  if (rateLimitResponse) {
    return finishResponse(rateLimitResponse, "rate_limited");
  }
  timing.mark("account_guard");

  const bodyResult = await readJsonBody<CreateReplyRequest>(request);

  if (!bodyResult.ok) {
    return finishResponse(bodyResult.response, "invalid_json");
  }

  const { clientRequestId, postId, content, isPromise, promiseDeadline } = bodyResult.body;

  const hasValidRequestId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientRequestId ?? "");
  if (isCandidateAtomicReplyEnabled() && !hasValidRequestId) {
    return finishResponse(
      fail(
        { code: "VALIDATION_ERROR", message: "요청 식별자가 올바르지 않습니다." },
        400,
      ),
      "invalid_request_id",
    );
  }

  const trimmedContent = content?.trim() ?? "";
  if (!isCandidateReplyLengthValid(trimmedContent)) {
    return finishResponse(
      fail(
        {
          code: "VALIDATION_ERROR",
          message: "답변은 1~2,000자여야 합니다.",
        },
        400,
      ),
      "invalid_content",
    );
  }

  const result = await createCandidateReply({
    authUserId: session.authUserId,
    clientRequestId: hasValidRequestId ? clientRequestId! : randomUUID(),
    postId,
    candidateId: session.candidateId,
    candidateName: session.name,
    content: trimmedContent,
    isPromise: Boolean(isPromise),
    promiseDeadline: promiseDeadline || null,
  });
  timing.mark("reply_transaction");

  if (!result.ok) {
    const status =
      result.code === "ALREADY_REPLIED" || result.code === "IDEMPOTENCY_CONFLICT"
        ? 409
        : result.code === "POST_NOT_ELIGIBLE"
          ? 404
          : result.code === "CANDIDATE_INACTIVE"
            ? 403
            : 500;
    return finishResponse(
      fail({ code: result.code, message: result.message }, status),
      result.code.toLowerCase(),
    );
  }

  return finishResponse(ok(
    {
      reply: result.reply,
      notification: isCandidateAtomicReplyEnabled() ? "queued" : "processed",
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  ), "ok");
}

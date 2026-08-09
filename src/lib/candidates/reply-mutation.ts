import { createHash } from "node:crypto";
import { isCandidateAtomicReplyEnabled } from "../candidate-dashboard/feature-flags";
import { sendReplyNotification } from "../email/send-reply-notification";
import {
  createCandidateReplyAtomicRepository,
  createReply,
  loadReplyNotificationPostRepository,
} from "../posts/repository";

type CreateCandidateReplyInput = {
  authUserId: string;
  clientRequestId: string;
  postId: string;
  candidateId: string;
  candidateName: string;
  content: string;
  isPromise: boolean;
  promiseDeadline: string | null;
};

type CreateCandidateReplyResult =
  | {
      ok: true;
      reply: {
        id: string;
        post_id: string;
        candidate_id: string;
        content: string;
        is_promise: boolean;
        promise_deadline?: string | null;
        created_at: string;
      };
    }
  | {
      ok: false;
      code:
        | "ALREADY_REPLIED"
        | "CANDIDATE_INACTIVE"
        | "CREATE_FAILED"
        | "IDEMPOTENCY_CONFLICT"
        | "POST_NOT_ELIGIBLE";
      message: string;
    };

export async function createCandidateReply(
  input: CreateCandidateReplyInput,
): Promise<CreateCandidateReplyResult> {
  if (isCandidateAtomicReplyEnabled()) {
    const requestHash = createHash("sha256")
      .update(JSON.stringify({
        postId: input.postId,
        content: input.content,
        isPromise: input.isPromise,
        promiseDeadline: input.promiseDeadline,
      }))
      .digest("hex");
    const result = await createCandidateReplyAtomicRepository({
      authUserId: input.authUserId,
      clientRequestId: input.clientRequestId,
      requestHash,
      postId: input.postId,
      content: input.content,
      isPromise: input.isPromise,
      promiseDeadline: input.promiseDeadline,
    });

    if (!result) {
      return { ok: false, code: "CREATE_FAILED", message: "답변 등록에 실패했습니다." };
    }
    if (result.status !== "ok") {
      const failureByStatus = {
        already_replied: { code: "ALREADY_REPLIED" as const, message: "이미 다른 후보자가 답변한 글입니다." },
        candidate_inactive: { code: "CANDIDATE_INACTIVE" as const, message: "활성화된 후보자만 답변할 수 있습니다." },
        candidate_not_found: { code: "CREATE_FAILED" as const, message: "후보자 정보를 확인할 수 없습니다." },
        idempotency_conflict: { code: "IDEMPOTENCY_CONFLICT" as const, message: "같은 요청 식별자로 다른 답변을 저장할 수 없습니다." },
        post_not_eligible: { code: "POST_NOT_ELIGIBLE" as const, message: "현재 후보자가 답변할 수 있는 글이 아닙니다." },
        validation_error: { code: "CREATE_FAILED" as const, message: "답변 내용을 확인해 주세요." },
      };
      return { ok: false, ...failureByStatus[result.status] };
    }
    return {
      ok: true,
      reply: {
        id: result.reply.id,
        post_id: result.reply.postId,
        candidate_id: result.reply.candidateId,
        content: result.reply.content,
        is_promise: result.reply.isPromise,
        promise_deadline: result.reply.promiseDeadline,
        created_at: result.reply.createdAt,
      },
    };
  }

  const reply = await createReply({
    postId: input.postId,
    candidateId: input.candidateId,
    content: input.content,
    isPromise: input.isPromise,
    promiseDeadline: input.promiseDeadline,
  });
  if (!reply) return { ok: false, code: "CREATE_FAILED", message: "답변 등록에 실패했습니다." };

  try {
    const post = await loadReplyNotificationPostRepository(input.postId);
    if (post?.notification_email && post.notification_email_verified_at) {
      await sendReplyNotification({
        toEmail: post.notification_email,
        postContent: post.content,
        publicUuid: post.public_uuid,
        candidateName: input.candidateName,
      });
    }
  } catch (emailError) {
    console.error("[reply] Email notification failed:", emailError);
  }
  return { ok: true, reply };
}

import { sendReplyNotification } from "../email/send-reply-notification";
import {
  attachCandidateFirstMessageRepository,
  createCandidateFirstMessageRepository,
  createReply,
  loadCandidateDistrictRepository,
  loadReplyNotificationPostRepository,
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
    }
  | {
      ok: false;
      code: "CREATE_FAILED" | "NOT_FOUND";
      message: string;
    };

type UpdateCandidateFirstMessageInput = {
  content: string;
  postId: string;
};

type CreateCandidateReplyInput = {
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
      code: "CREATE_FAILED";
      message: string;
    };

export async function updateCandidateFirstMessage(
  input: UpdateCandidateFirstMessageInput,
) {
  await updateCandidateFirstMessageRepository(input.postId, input.content);
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
  };
}

export async function createCandidateReply(
  input: CreateCandidateReplyInput,
): Promise<CreateCandidateReplyResult> {
  const reply = await createReply({
    postId: input.postId,
    candidateId: input.candidateId,
    content: input.content,
    isPromise: input.isPromise,
    promiseDeadline: input.promiseDeadline,
  });

  if (!reply) {
    return {
      ok: false,
      code: "CREATE_FAILED",
      message: "답변 등록에 실패했습니다.",
    };
  }

  try {
    const post = await loadReplyNotificationPostRepository(input.postId);

    if (post?.notification_email) {
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

  return {
    ok: true,
    reply,
  };
}

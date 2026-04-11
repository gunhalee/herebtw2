import { fail, ok } from "../../../../lib/api/response";
import { readJsonBody } from "../../../../lib/api/request";
import { getCandidateSession } from "../../../../lib/auth/candidate-session";
import { createReply, findPostByUuidRepository } from "../../../../lib/posts/repository";
import { sendReplyNotification } from "../../../../lib/email/send-reply-notification";
import { supabaseSelect } from "../../../../lib/supabase/rest";

type CreateReplyRequest = {
  postId: string;
  candidateId: string;
  content: string;
  isPromise: boolean;
  promiseDeadline: string | null;
};

export async function POST(request: Request) {
  const session = await getCandidateSession();

  if (!session) {
    return fail({ code: "UNAUTHORIZED", message: "인증이 필요합니다." }, 401);
  }

  const bodyResult = await readJsonBody<CreateReplyRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const { postId, content, isPromise, promiseDeadline } = bodyResult.body;

  const trimmedContent = content?.trim() ?? "";
  if (trimmedContent.length < 1 || trimmedContent.length > 200) {
    return fail(
      { code: "VALIDATION_ERROR", message: "답변은 1~200자여야 합니다." },
      400,
    );
  }

  const reply = await createReply({
    postId,
    candidateId: session.candidateId,
    content: trimmedContent,
    isPromise: Boolean(isPromise),
    promiseDeadline: promiseDeadline || null,
  });

  if (!reply) {
    return fail(
      { code: "CREATE_FAILED", message: "답변 등록에 실패했습니다." },
      500,
    );
  }

  // Send email notification if the post has a notification_email
  try {
    const posts = await supabaseSelect<Array<{
      id: string;
      public_uuid: string;
      content: string;
      notification_email: string | null;
    }>>(
      `posts?select=id,public_uuid,content,notification_email&id=eq.${postId}&limit=1`,
    );

    const post = posts?.[0];
    if (post?.notification_email) {
      await sendReplyNotification({
        toEmail: post.notification_email,
        postContent: post.content,
        publicUuid: post.public_uuid,
        candidateName: session.name,
      });
    }
  } catch (emailError) {
    console.error("[reply] Email notification failed:", emailError);
  }

  return ok({ reply });
}

import { fail, ok } from "../../../../lib/api/response";
import { readJsonBody } from "../../../../lib/api/request";
import { getCandidateSession } from "../../../../lib/auth/candidate-session";
import { createCandidateReply } from "../../../../lib/candidates/mutations";

type CreateReplyRequest = {
  postId: string;
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

  const result = await createCandidateReply({
    postId,
    candidateId: session.candidateId,
    candidateName: session.name,
    content: trimmedContent,
    isPromise: Boolean(isPromise),
    promiseDeadline: promiseDeadline || null,
  });

  if (!result.ok) {
    return fail(
      { code: result.code, message: result.message },
      500,
    );
  }

  return ok({ reply: result.reply });
}

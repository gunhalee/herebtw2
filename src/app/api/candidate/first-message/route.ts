import { fail, ok } from "../../../../lib/api/response";
import { readJsonBody } from "../../../../lib/api/request";
import { getCandidateSession } from "../../../../lib/auth/candidate-session";
import {
  createCandidateFirstMessage,
  updateCandidateFirstMessage,
} from "../../../../lib/candidates/mutations";
import { hasSupabaseServerConfig } from "../../../../lib/supabase/config";

type UpdateFirstMessageRequest = {
  content: string;
};

export async function PATCH(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return fail({ code: "NO_CONFIG", message: "Supabase 설정이 없습니다." }, 500);
  }

  const session = await getCandidateSession();

  if (!session) {
    return fail({ code: "UNAUTHORIZED", message: "인증이 필요합니다." }, 401);
  }

  if (!session.firstMessageId) {
    return fail({ code: "NOT_FOUND", message: "첫 마디가 없습니다." }, 404);
  }

  const bodyResult = await readJsonBody<UpdateFirstMessageRequest>(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const { content } = bodyResult.body;
  const trimmedContent = content?.trim() ?? "";

  if (trimmedContent.length < 1 || trimmedContent.length > 100) {
    return fail({ code: "VALIDATION_ERROR", message: "내용은 1~100자여야 합니다." }, 400);
  }

  await updateCandidateFirstMessage({
    postId: session.firstMessageId,
    content: trimmedContent,
  });

  return ok({ content: trimmedContent });
}

type FirstMessageRequest = {
  content: string;
};

export async function POST(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return fail({ code: "NO_CONFIG", message: "Supabase 설정이 없습니다." }, 500);
  }

  const session = await getCandidateSession();

  if (!session) {
    return fail({ code: "UNAUTHORIZED", message: "인증이 필요합니다." }, 401);
  }

  if (session.hasFirstMessage) {
    return fail({ code: "ALREADY_EXISTS", message: "이미 첫 마디를 작성했습니다." }, 400);
  }

  const bodyResult = await readJsonBody<FirstMessageRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const { content } = bodyResult.body;
  const trimmedContent = content?.trim() ?? "";

  if (trimmedContent.length < 1 || trimmedContent.length > 100) {
    return fail({ code: "VALIDATION_ERROR", message: "내용은 1~100자여야 합니다." }, 400);
  }

  const result = await createCandidateFirstMessage({
    candidateId: session.candidateId,
    content: trimmedContent,
  });

  if (!result.ok) {
    return fail(
      { code: result.code, message: result.message },
      result.code === "NOT_FOUND" ? 404 : 500,
    );
  }

  return ok({ post: result.post });
}

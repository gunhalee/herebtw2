import { fail, ok } from "../../../../lib/api/response";
import { readJsonBody } from "../../../../lib/api/request";
import { getCandidateSession } from "../../../../lib/auth/candidate-session";
import { hasSupabaseServerConfig } from "../../../../lib/supabase/config";
import { supabaseInsert, supabaseSelect } from "../../../../lib/supabase/rest";

type FirstMessageRequest = {
  candidateId: string;
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

  // Find candidate's district for dong_name
  const candidates = await supabaseSelect<Array<{ id: string; district: string }>>(
    `candidates?select=id,district&id=eq.${session.candidateId}&limit=1`,
  );
  const candidate = candidates?.[0];

  if (!candidate) {
    return fail({ code: "NOT_FOUND", message: "후보 정보를 찾을 수 없습니다." }, 404);
  }

  // Create post as candidate first message
  const posts = await supabaseInsert<Array<{ id: string; public_uuid: string; created_at: string }>>(
    "posts?select=id,public_uuid,created_at",
    {
      author_device_id: null,
      content: trimmedContent,
      administrative_dong_name: candidate.district,
      administrative_dong_code: `candidate:${session.candidateId}`,
      is_pinned: true,
      author_type: "candidate",
      candidate_id: session.candidateId,
    },
  );

  const post = posts?.[0];

  if (!post) {
    return fail({ code: "CREATE_FAILED", message: "첫 마디를 등록하지 못했습니다." }, 500);
  }

  // Update candidate's first_message_id
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/candidates?id=eq.${session.candidateId}`,
    {
      method: "PATCH",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ first_message_id: post.id }),
    },
  );

  return ok({ post });
}

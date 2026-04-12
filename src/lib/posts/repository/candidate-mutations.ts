import { supabaseInsert, supabasePatchMinimal } from "../../supabase/rest";
import type { ReplyRow } from "./types";

async function createCandidateFirstMessageRepository(input: {
  candidateId: string;
  district: string;
  content: string;
}) {
  const rows = await supabaseInsert<
    Array<{ id: string; public_uuid: string; created_at: string }>
  >("posts?select=id,public_uuid,created_at", {
    content: input.content,
    administrative_dong_name: input.district,
    administrative_dong_code: `candidate:${input.candidateId}`,
    is_pinned: true,
    author_type: "candidate",
    candidate_id: input.candidateId,
  });

  return rows?.[0] ?? null;
}

async function attachCandidateFirstMessageRepository(
  candidateId: string,
  postId: string,
) {
  await supabasePatchMinimal(`candidates?id=eq.${candidateId}`, {
    first_message_id: postId,
  });
}

async function updateCandidateFirstMessageRepository(
  postId: string,
  content: string,
) {
  await supabasePatchMinimal(`posts?id=eq.${postId}`, {
    content,
  });
}

async function createReply(input: {
  postId: string;
  candidateId: string;
  content: string;
  isPromise: boolean;
  promiseDeadline: string | null;
}) {
  const rows = await supabaseInsert<ReplyRow[]>(
    "replies?select=id,post_id,candidate_id,content,is_promise,promise_deadline,created_at",
    {
      post_id: input.postId,
      candidate_id: input.candidateId,
      content: input.content,
      is_promise: input.isPromise,
      ...(input.promiseDeadline ? { promise_deadline: input.promiseDeadline } : {}),
    },
  );

  return rows?.[0] ?? null;
}

export {
  attachCandidateFirstMessageRepository,
  createCandidateFirstMessageRepository,
  createReply,
  updateCandidateFirstMessageRepository,
};

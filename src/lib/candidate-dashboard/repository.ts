import { supabaseRpc } from "../supabase/rest";
import type {
  CandidateDashboardBootstrap,
  CandidateDashboardCursorParts,
  CandidateDashboardFilter,
} from "./types";

export async function loadCandidateDashboardBootstrapV2(input: {
  authUserId: string;
  filter?: CandidateDashboardFilter;
  limit?: number;
  cursor?: CandidateDashboardCursorParts | null;
}) {
  return supabaseRpc<CandidateDashboardBootstrap>(
    "get_candidate_dashboard_bootstrap_v2",
    {
      p_auth_user_id: input.authUserId,
      p_filter: input.filter ?? "open",
      p_limit: Math.max(1, Math.min(input.limit ?? 20, 50)),
      p_cursor_agree_count: input.cursor?.agreeCount ?? null,
      p_cursor_created_at: input.cursor?.createdAt ?? null,
      p_cursor_post_id: input.cursor?.postId ?? null,
    },
  );
}

export type CandidateReplyTarget =
  | {
      status: "eligible";
      post: {
        id: string;
        public_uuid: string;
        content: string;
        administrative_dong_name: string;
        created_at: string;
      };
    }
  | { status: "already_replied"; publicUuid: string }
  | { status: "not_found" };

export async function loadCandidateReplyTargetV2(input: {
  authUserId: string;
  postId: string;
}) {
  return supabaseRpc<CandidateReplyTarget>("get_candidate_reply_target_v2", {
    p_auth_user_id: input.authUserId,
    p_post_id: input.postId,
  });
}

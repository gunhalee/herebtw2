import { hasSupabaseServerConfig } from "../../supabase/config";
import {
  supabaseInsert,
  supabaseRpc,
  supabaseSelect,
} from "../../supabase/rest";
import type {
  CandidateRow,
  DashboardStatsRow,
  DistrictPostRow,
  PromiseRow,
  ReplyRow,
  SettingRow,
} from "./types";

async function findCandidateByAuthUserId(authUserId: string) {
  if (!hasSupabaseServerConfig()) return null;

  const rows = await supabaseSelect<CandidateRow[]>(
    `candidates?select=id,auth_user_id,name,district,email,first_message_id,is_active,created_at,activated_at&auth_user_id=eq.${authUserId}&limit=1`,
  );

  return rows?.[0] ?? null;
}

async function findCandidateById(candidateId: string) {
  if (!hasSupabaseServerConfig()) return null;

  const rows = await supabaseSelect<CandidateRow[]>(
    `candidates?select=id,auth_user_id,name,district,email,first_message_id,is_active,created_at,activated_at&id=eq.${candidateId}&limit=1`,
  );

  return rows?.[0] ?? null;
}

async function loadDistrictPosts(district: string, candidateId?: string) {
  if (!hasSupabaseServerConfig()) return [];

  const rows = await supabaseRpc<DistrictPostRow[]>("list_district_posts", {
    target_district: district,
    viewer_candidate_id: candidateId ?? null,
  });

  return rows ?? [];
}

async function loadDashboardStats(district: string) {
  if (!hasSupabaseServerConfig()) {
    return { total_posts: 0, replied_posts: 0, unreplied_posts: 0, reply_rate: 0 };
  }

  const rows = await supabaseRpc<DashboardStatsRow[]>(
    "get_candidate_dashboard_stats",
    { target_district: district },
  );

  return rows?.[0] ?? { total_posts: 0, replied_posts: 0, unreplied_posts: 0, reply_rate: 0 };
}

async function createReply(input: {
  postId: string;
  candidateId: string;
  content: string;
  isPromise: boolean;
  promiseDeadline: string | null;
}) {
  if (!hasSupabaseServerConfig()) return null;

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

async function loadCandidatePromises(candidateId: string) {
  if (!hasSupabaseServerConfig()) return [];

  const rows = await supabaseRpc<PromiseRow[]>("list_candidate_promises", {
    target_candidate_id: candidateId,
  });

  return rows ?? [];
}

async function loadSetting(key: string) {
  if (!hasSupabaseServerConfig()) return null;

  const rows = await supabaseSelect<SettingRow[]>(
    `settings?select=key,value&key=eq.${key}&limit=1`,
  );

  return rows?.[0]?.value ?? null;
}

export {
  createReply,
  findCandidateByAuthUserId,
  findCandidateById,
  loadCandidatePromises,
  loadDashboardStats,
  loadDistrictPosts,
  loadSetting,
};

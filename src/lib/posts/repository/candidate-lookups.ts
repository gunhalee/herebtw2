import { supabaseRpc, supabaseSelect } from "../../supabase/rest";
import type {
  CandidateRow,
  DashboardStatsRow,
  DistrictPostRow,
  PromiseRow,
  SettingRow,
} from "./types";

async function findCandidateByAuthUserId(authUserId: string) {
  const rows = await supabaseSelect<CandidateRow[]>(
    `candidates?select=id,auth_user_id,name,district,email,first_message_id,is_active,created_at,activated_at&auth_user_id=eq.${authUserId}&limit=1`,
  );

  return rows?.[0] ?? null;
}

async function findCandidateById(candidateId: string) {
  const rows = await supabaseSelect<CandidateRow[]>(
    `candidates?select=id,auth_user_id,name,district,email,photo_url,first_message_id,metro_council_district,local_council_district,council_type,is_active,created_at,activated_at&id=eq.${candidateId}&limit=1`,
  );

  return rows?.[0] ?? null;
}

async function loadDistrictPosts(district: string, candidateId?: string) {
  const rows = await supabaseRpc<DistrictPostRow[]>("list_district_posts", {
    target_district: district,
    viewer_candidate_id: candidateId ?? null,
  });

  return rows ?? [];
}

async function loadDashboardStats(district: string) {
  const rows = await supabaseRpc<DashboardStatsRow[]>(
    "get_candidate_dashboard_stats",
    { target_district: district },
  );

  return rows?.[0] ?? { total_posts: 0, replied_posts: 0, unreplied_posts: 0, reply_rate: 0 };
}

async function loadCandidateDistrictRepository(candidateId: string) {
  const rows = await supabaseSelect<Array<{ id: string; district: string }>>(
    `candidates?select=id,district&id=eq.${candidateId}&limit=1`,
  );

  return rows?.[0] ?? null;
}

async function loadReplyNotificationPostRepository(postId: string) {
  const rows = await supabaseSelect<
    Array<{
      id: string;
      public_uuid: string;
      content: string;
      notification_email: string | null;
    }>
  >(
    `posts?select=id,public_uuid,content,notification_email&id=eq.${postId}&limit=1`,
  );

  return rows?.[0] ?? null;
}

async function loadCandidatePromises(candidateId: string) {
  const rows = await supabaseRpc<PromiseRow[]>("list_candidate_promises", {
    target_candidate_id: candidateId,
  });

  return rows ?? [];
}

async function loadFirstMessage(postId: string) {
  const rows = await supabaseSelect<
    Array<{ id: string; content: string; public_uuid: string }>
  >(
    `posts?select=id,content,public_uuid&id=eq.${postId}&limit=1`,
  );

  return rows?.[0] ?? null;
}

async function loadSetting(key: string) {
  const rows = await supabaseSelect<SettingRow[]>(
    `settings?select=key,value&key=eq.${key}&limit=1`,
  );

  return rows?.[0]?.value ?? null;
}

export {
  findCandidateByAuthUserId,
  findCandidateById,
  loadCandidateDistrictRepository,
  loadCandidatePromises,
  loadDashboardStats,
  loadDistrictPosts,
  loadFirstMessage,
  loadReplyNotificationPostRepository,
  loadSetting,
};

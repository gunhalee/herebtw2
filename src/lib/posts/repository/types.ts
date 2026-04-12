type PostRow = {
  id: string;
  public_uuid?: string;
  content: string;
  administrative_dong_name: string;
  author_device_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  latitude_bucket_100m?: number | null;
  longitude_bucket_100m?: number | null;
  reply_status?: string;
  notification_email?: string | null;
  created_at: string;
  delete_expires_at: string;
};

type NearbyPostRow = PostRow & {
  distance_meters: number;
  agree_count?: number;
  my_agree?: boolean;
  can_report?: boolean;
  reply_candidate_name?: string | null;
  reply_candidate_photo_url?: string | null;
  reply_candidate_local_council_district?: string | null;
  reply_candidate_council_type?: string | null;
  reply_content?: string | null;
  reply_is_promise?: boolean | null;
};

type PostDetailRow = {
  id: string;
  public_uuid: string;
  content: string;
  administrative_dong_name: string;
  created_at: string;
  reply_status: string;
  agree_count: number;
  notification_email?: string | null;
  reply_id?: string | null;
  reply_candidate_name?: string | null;
  reply_candidate_district?: string | null;
  reply_candidate_local_council_district?: string | null;
  reply_candidate_metro_council_district?: string | null;
  reply_candidate_council_type?: string | null;
  reply_content?: string | null;
  reply_is_promise?: boolean;
  reply_promise_deadline?: string | null;
  reply_created_at?: string | null;
};

type CandidateRow = {
  id: string;
  auth_user_id?: string | null;
  name: string;
  district: string;
  email: string;
  first_message_id?: string | null;
  is_active: boolean;
  created_at: string;
  activated_at?: string | null;
};

type ReplyRow = {
  id: string;
  post_id: string;
  candidate_id: string;
  content: string;
  is_promise: boolean;
  promise_deadline?: string | null;
  created_at: string;
};

type DistrictPostRow = {
  id: string;
  public_uuid: string;
  content: string;
  administrative_dong_name: string;
  created_at: string;
  reply_status: string;
  is_pinned: boolean;
  author_type: string;
  agree_count: number;
  has_reply: boolean;
  reply_candidate_name?: string | null;
  reply_content?: string | null;
  reply_is_promise?: boolean;
  reply_promise_deadline?: string | null;
  reply_created_at?: string | null;
};

type DashboardStatsRow = {
  total_posts: number;
  replied_posts: number;
  unreplied_posts: number;
  reply_rate: number;
};

type PromiseRow = {
  reply_id: string;
  post_id: string;
  post_public_uuid: string;
  post_content: string;
  post_dong_name: string;
  post_created_at: string;
  reply_content: string;
  reply_created_at: string;
  promise_deadline: string | null;
  candidate_name: string;
  candidate_district: string;
};

type SettingRow = {
  key: string;
  value: string;
};

type DeviceIdentityRow = {
  id: string;
  anonymous_device_id: string;
};

type PostListCursor = {
  distanceMeters: number;
  createdAt: string;
  postId: string;
};

type GlobalPostListCursor = {
  createdAt: string;
  postId: string;
};

type PostEngagementRow = {
  post_id: string;
  agree_count: number;
};

type ReactionRow = {
  id: string;
  post_id: string;
  device_id: string;
  reaction_type: string;
};

type ReportRow = {
  id: string;
  post_id: string;
  reporter_device_id: string;
  reason_code: string;
};

type ToggleAgreeRpcRow = {
  agreed: boolean;
  agree_count: number;
};

type FeedScope = "nearby" | "global";

type FeedFallbackReason = "missing_rpc" | "unexpected_rpc_shape";

export type {
  CandidateRow,
  DashboardStatsRow,
  DeviceIdentityRow,
  DistrictPostRow,
  FeedFallbackReason,
  FeedScope,
  GlobalPostListCursor,
  NearbyPostRow,
  PostDetailRow,
  PostEngagementRow,
  PostListCursor,
  PostRow,
  PromiseRow,
  ReactionRow,
  ReplyRow,
  ReportRow,
  SettingRow,
  ToggleAgreeRpcRow,
};

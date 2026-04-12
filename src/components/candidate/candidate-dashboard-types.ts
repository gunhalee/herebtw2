export type DashboardPost = {
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

export type DashboardStats = {
  total_posts: number;
  replied_posts: number;
  unreplied_posts: number;
  reply_rate: number;
};

export type FirstMessage = {
  id: string;
  content: string;
};

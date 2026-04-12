export type PromiseItem = {
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

export type PromiseArchiveCandidate = {
  id: string;
  name: string;
  district: string;
};

export type PromiseArchiveStats = {
  totalPosts: number;
  repliedPosts: number;
  replyRate: number;
  promiseCount: number;
};

export type PromiseArchiveScreenProps = {
  candidate: PromiseArchiveCandidate;
  promises: PromiseItem[];
  stats: PromiseArchiveStats;
  electionDate: string;
};

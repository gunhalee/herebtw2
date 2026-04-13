-- Candidate reply archive queries filter by candidate_id and paginate by created_at/id.
create index if not exists idx_replies_candidate_created_at_id
  on public.replies (candidate_id, created_at desc, id asc);

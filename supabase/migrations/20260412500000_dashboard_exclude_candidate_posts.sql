-- Exclude candidate-authored posts from list_district_posts (shown separately in dashboard)
create or replace function public.list_district_posts(
  target_district text,
  viewer_candidate_id uuid default null,
  cursor_created_at timestamptz default null,
  cursor_post_id uuid default null,
  result_limit integer default 20
)
returns table (
  id uuid,
  public_uuid uuid,
  content varchar(100),
  administrative_dong_name text,
  created_at timestamptz,
  reply_status text,
  is_pinned boolean,
  author_type text,
  agree_count integer,
  has_reply boolean,
  reply_candidate_name text,
  reply_content varchar(200),
  reply_is_promise boolean,
  reply_promise_deadline date,
  reply_created_at timestamptz
)
language sql
stable
as $$
  with district_posts as (
    select
      p.id,
      p.public_uuid,
      p.content,
      p.administrative_dong_name,
      p.created_at,
      p.reply_status,
      p.is_pinned,
      p.author_type
    from public.posts p
    where p.status = 'active'
      and p.author_type = 'citizen'
      and p.administrative_dong_name like '%' || target_district || '%'
      and (
        cursor_created_at is null
        or p.created_at < cursor_created_at
        or (p.created_at = cursor_created_at and p.id > cursor_post_id)
      )
  ),
  with_engagement as (
    select
      dp.*,
      coalesce(ev.agree_count, 0)::integer as agree_count
    from district_posts dp
    left join public.post_engagement_view ev on ev.post_id = dp.id
  ),
  with_replies as (
    select
      we.*,
      r.id is not null as has_reply,
      c.name as reply_candidate_name,
      r.content as reply_content,
      r.is_promise as reply_is_promise,
      r.promise_deadline as reply_promise_deadline,
      r.created_at as reply_created_at
    from with_engagement we
    left join public.replies r on r.post_id = we.id
    left join public.candidates c on c.id = r.candidate_id
  )
  select
    wr.id,
    wr.public_uuid,
    wr.content,
    wr.administrative_dong_name,
    wr.created_at,
    wr.reply_status,
    wr.is_pinned,
    wr.author_type,
    wr.agree_count,
    wr.has_reply,
    wr.reply_candidate_name,
    wr.reply_content,
    wr.reply_is_promise,
    wr.reply_promise_deadline,
    wr.reply_created_at
  from with_replies wr
  order by
    case when wr.reply_status = 'delivered' then 0 else 1 end,
    wr.agree_count desc,
    wr.created_at desc,
    wr.id asc
  limit least(greatest(coalesce(result_limit, 20), 1), 51);
$$;

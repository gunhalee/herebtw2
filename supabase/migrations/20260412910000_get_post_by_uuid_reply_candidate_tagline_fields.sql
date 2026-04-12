-- Photocard reply tagline needs district/council metadata from the replier candidate.
drop function if exists public.get_post_by_uuid(uuid);

create or replace function public.get_post_by_uuid(target_uuid uuid)
returns table (
  id uuid,
  public_uuid uuid,
  content varchar(100),
  administrative_dong_name text,
  created_at timestamptz,
  reply_status text,
  agree_count integer,
  notification_email varchar(255),
  reply_id uuid,
  reply_candidate_name text,
  reply_candidate_district text,
  reply_candidate_local_council_district text,
  reply_candidate_metro_council_district text,
  reply_candidate_council_type text,
  reply_content varchar(200),
  reply_is_promise boolean,
  reply_promise_deadline date,
  reply_created_at timestamptz
)
language sql
stable
as $$
  select
    p.id,
    p.public_uuid,
    p.content,
    p.administrative_dong_name,
    p.created_at,
    p.reply_status,
    coalesce(ev.agree_count, 0) as agree_count,
    p.notification_email,
    r.id as reply_id,
    c.name as reply_candidate_name,
    c.district as reply_candidate_district,
    c.local_council_district as reply_candidate_local_council_district,
    c.metro_council_district as reply_candidate_metro_council_district,
    c.council_type as reply_candidate_council_type,
    r.content as reply_content,
    r.is_promise as reply_is_promise,
    r.promise_deadline as reply_promise_deadline,
    r.created_at as reply_created_at
  from public.posts p
  left join public.post_engagement_view ev on ev.post_id = p.id
  left join public.replies r on r.post_id = p.id
  left join public.candidates c on c.id = r.candidate_id
  where p.public_uuid = target_uuid
    and p.status = 'active'
  limit 1;
$$;


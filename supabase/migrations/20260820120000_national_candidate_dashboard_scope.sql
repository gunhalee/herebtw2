-- Nationwide candidates (district = '전국') must see all citizen posts on the dashboard.
-- Legacy list/stats previously used LIKE '%전국%' against administrative_dong_name,
-- which never matches real addresses. Inbox routing now also treats 당대표 as nationwide.

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
      and (
        target_district = '전국'
        or p.administrative_dong_name like '%' || target_district || '%'
      )
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

create or replace function public.get_candidate_dashboard_stats(target_district text)
returns table (
  total_posts bigint,
  replied_posts bigint,
  unreplied_posts bigint,
  reply_rate numeric
)
language sql
stable
as $$
  select
    count(*)::bigint as total_posts,
    count(*) filter (where p.reply_status = 'replied')::bigint as replied_posts,
    count(*) filter (where p.reply_status = 'delivered')::bigint as unreplied_posts,
    case
      when count(*) = 0 then 0
      else round(count(*) filter (where p.reply_status = 'replied')::numeric / count(*)::numeric * 100, 1)
    end as reply_rate
  from public.posts p
  where p.status = 'active'
    and p.author_type = 'citizen'
    and (
      target_district = '전국'
      or p.administrative_dong_name like '%' || target_district || '%'
    );
$$;

create or replace function private.process_candidate_routing_batch(p_limit integer default 200)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  work record;
  target_candidate record;
  existing_candidate record;
  target_post public.posts;
  reply_candidate_id uuid;
  agree_count integer;
  processed integer := 0;
  worker_id uuid := gen_random_uuid();
begin
  for work in
    with claimable as (
      select post_id
      from public.candidate_routing_queue
      where requested_version > processed_version
        and available_at <= now()
        and (locked_at is null or locked_at < now() - interval '2 minutes')
      order by available_at, updated_at, post_id
      for update skip locked
      limit greatest(1, least(coalesce(p_limit, 200), 1000))
    )
    update public.candidate_routing_queue as queue
    set locked_by = worker_id, locked_at = now(), attempts = attempts + 1
    from claimable
    where queue.post_id = claimable.post_id
    returning queue.*
  loop
    begin
    select * into target_post from public.posts where id = work.post_id;
    select candidate_id into reply_candidate_id
      from public.replies where post_id = work.post_id limit 1;
    select count(*)::integer into agree_count
      from public.post_reactions
      where post_id = work.post_id and reaction_type = 'agree';

    for existing_candidate in
      select distinct candidate_id, coverage_version
      from public.candidate_post_inbox where post_id = work.post_id
    loop
      update public.candidate_post_inbox
      set state = 'hidden', updated_at = now()
      where candidate_id = existing_candidate.candidate_id
        and coverage_version = existing_candidate.coverage_version
        and post_id = work.post_id;
    end loop;

    if target_post.id is not null
      and target_post.status = 'active'
      and target_post.moderation_state in ('allowed', 'approved')
      and target_post.author_type = 'citizen'
      and target_post.created_at >= (
        select value::timestamptz from public.settings where key = 'candidate_inbox_start_at'
      )
      and (
        target_post.location_area_code is not null
        or exists (
          select 1
          from public.candidates candidate
          where candidate.is_active
            and candidate.council_type = '당대표'
            and candidate.district = '전국'
        )
      ) then
      for target_candidate in
        select distinct routed.id, routed.coverage_version
        from (
          select candidate.id, candidate.coverage_version
          from public.candidates as candidate
          where candidate.is_active
            and candidate.council_type = '당대표'
            and candidate.district = '전국'

          union

          select candidate.id, candidate.coverage_version
          from public.candidates as candidate
          join public.candidate_coverage_areas as coverage
            on coverage.candidate_id = candidate.id
           and coverage.coverage_version = candidate.coverage_version
           and coverage.active_from <= now()
           and (coverage.active_until is null or coverage.active_until > now())
          join public.administrative_areas as coverage_area
            on coverage_area.code = coverage.area_code
          where candidate.is_active
            and not (
              candidate.council_type = '당대표'
              and candidate.district = '전국'
            )
            and target_post.location_area_code is not null
            and (
              (
                target_post.location_scope = 'province'
                and coverage.area_code = target_post.location_area_code
                and coverage_area.level = 'province'
              )
              or (
                target_post.location_scope = 'district'
                and (
                  exists (
                    select 1 from public.administrative_area_closure relation
                    where relation.ancestor_code = target_post.location_area_code
                      and relation.descendant_code = coverage.area_code
                  )
                  or exists (
                    select 1 from public.administrative_area_closure relation
                    where relation.ancestor_code = coverage.area_code
                      and relation.descendant_code = target_post.location_area_code
                  )
                )
              )
              or (
                target_post.location_scope = 'dong'
                and exists (
                  select 1 from public.administrative_area_closure relation
                  where relation.ancestor_code = coverage.area_code
                    and relation.descendant_code = target_post.location_area_code
                )
              )
              or (
                coverage_area.level = 'province'
                and left(target_post.location_area_code, 2) = left(coverage.area_code, 2)
              )
            )
        ) as routed
      loop
        insert into public.candidate_post_inbox (
          candidate_id, coverage_version, post_id, state,
          agree_count_snapshot, post_created_at, routed_at, updated_at
        ) values (
          target_candidate.id,
          target_candidate.coverage_version,
          target_post.id,
          case
            when reply_candidate_id is null then 'open'
            when reply_candidate_id = target_candidate.id then 'replied_by_me'
            else 'closed_by_other'
          end,
          agree_count,
          target_post.created_at,
          now(),
          now()
        )
        on conflict (candidate_id, coverage_version, post_id) do update set
          state = excluded.state,
          agree_count_snapshot = excluded.agree_count_snapshot,
          post_created_at = excluded.post_created_at,
          routed_at = excluded.routed_at,
          updated_at = excluded.updated_at;
      end loop;
    end if;

    for existing_candidate in
      select distinct candidate_id, coverage_version
      from public.candidate_post_inbox where post_id = work.post_id
    loop
      perform private.refresh_candidate_counters(
        existing_candidate.candidate_id,
        existing_candidate.coverage_version
      );
    end loop;

    update public.candidate_routing_queue
    set processed_version = requested_version,
        locked_by = null,
        locked_at = null,
        last_error_code = null,
        updated_at = now()
    where post_id = work.post_id and locked_by = worker_id;
    processed := processed + 1;
    exception when others then
      update public.candidate_routing_queue
      set processed_version = case when attempts >= 6 then requested_version else processed_version end,
          available_at = now() + make_interval(secs => least(3600, 30 * (2 ^ least(attempts, 7)))::integer),
          locked_by = null,
          locked_at = null,
          last_error_code = left(sqlstate || ':' || sqlerrm, 240),
          updated_at = now()
      where post_id = work.post_id and locked_by = worker_id;
    end;
  end loop;
  return processed;
end;
$$;

insert into public.candidate_routing_queue (post_id, reason)
select post.id, 'backfill'
from public.posts post
where post.status = 'active'
  and post.moderation_state in ('allowed', 'approved')
  and post.author_type = 'citizen'
  and post.created_at >= (
    select value::timestamptz from public.settings where key = 'candidate_inbox_start_at'
  )
on conflict (post_id) do update
  set reason = excluded.reason,
      requested_version = public.candidate_routing_queue.requested_version + 1,
      available_at = now(),
      updated_at = now();

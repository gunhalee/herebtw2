-- list_posts_feed: 코드의 viewer_local_council_district / viewer_metro_council_district 파라미터에 맞춰 재생성

do $$
declare
  r record;
begin
  for r in
    select oid::regprocedure::text as sig
    from pg_proc
    where proname = 'list_posts_feed'
      and pronamespace = 'public'::regnamespace
  loop
    execute 'drop function if exists ' || r.sig || ' cascade';
  end loop;
end $$;

create function public.list_posts_feed(
  viewer_latitude double precision default null,
  viewer_longitude double precision default null,
  viewer_anonymous_device_id text default null,
  cursor_distance_meters integer default null,
  cursor_created_at timestamptz default null,
  cursor_post_id uuid default null,
  result_limit integer default 10,
  viewer_local_council_district text default null,
  viewer_metro_council_district text default null
)
returns table (
  id uuid,
  public_uuid uuid,
  content varchar(100),
  administrative_dong_name text,
  created_at timestamptz,
  delete_expires_at timestamptz,
  latitude double precision,
  longitude double precision,
  distance_meters integer,
  agree_count integer,
  my_agree boolean,
  can_report boolean,
  reply_status text,
  reply_candidate_name text,
  reply_candidate_photo_url text,
  reply_candidate_local_council_district text,
  reply_candidate_council_type text,
  reply_content varchar(200),
  reply_is_promise boolean
)
language sql
stable
as $func$
  with viewer as (
    select
      case
        when viewer_latitude is null then null
        else round((viewer_latitude * 111320.0) / 100.0)::integer
      end as viewer_latitude_bucket_100m,
      case
        when viewer_latitude is null or viewer_longitude is null then null
        else round(
          (
            viewer_longitude *
            greatest(111320.0 * cos(radians(viewer_latitude)), 0.000001)
          ) / 100.0
        )::integer
      end as viewer_longitude_bucket_100m,
      device.id as viewer_device_id,
      viewer_anonymous_device_id is not null as has_viewer_identity
    from (select 1) seed
    left join public.device_identities as device
      on device.anonymous_device_id = viewer_anonymous_device_id
  ),
  viewer_reported_posts as (
    select report.post_id
    from public.post_reports as report
    cross join viewer
    where viewer.viewer_device_id is not null
      and report.reporter_device_id = viewer.viewer_device_id
    group by report.post_id
  ),
  ranked_posts as (
    select
      p.id,
      p.public_uuid,
      p.content,
      p.administrative_dong_name,
      p.created_at,
      p.delete_expires_at,
      p.latitude,
      p.longitude,
      p.reply_status,
      viewer.viewer_device_id,
      viewer.has_viewer_identity,
      case
        when viewer.viewer_latitude_bucket_100m is null
          or viewer.viewer_longitude_bucket_100m is null
          or p.latitude_bucket_100m is null
          or p.longitude_bucket_100m is null then 2147483647
        else ceil(
          sqrt(
            power(p.latitude_bucket_100m - viewer.viewer_latitude_bucket_100m, 2) +
            power(p.longitude_bucket_100m - viewer.viewer_longitude_bucket_100m, 2)
          ) * 100.0
        )::integer
      end as distance_meters
    from public.posts as p
    cross join viewer
    where p.status = 'active'
      and p.latitude is not null
      and p.longitude is not null
  ),
  selected_posts as (
    select
      ranked_posts.id,
      ranked_posts.public_uuid,
      ranked_posts.content,
      ranked_posts.administrative_dong_name,
      ranked_posts.created_at,
      ranked_posts.delete_expires_at,
      ranked_posts.latitude,
      ranked_posts.longitude,
      ranked_posts.reply_status,
      ranked_posts.viewer_device_id,
      ranked_posts.has_viewer_identity,
      ranked_posts.distance_meters
    from ranked_posts
    left join viewer_reported_posts
      on viewer_reported_posts.post_id = ranked_posts.id
    where viewer_reported_posts.post_id is null
      and (
        cursor_distance_meters is null
        or ranked_posts.distance_meters > cursor_distance_meters
        or (ranked_posts.distance_meters = cursor_distance_meters and ranked_posts.created_at < cursor_created_at)
        or (ranked_posts.distance_meters = cursor_distance_meters and ranked_posts.created_at = cursor_created_at and ranked_posts.id > cursor_post_id)
      )
    order by
      case when ranked_posts.reply_status = 'replied' then 0 else 1 end asc,
      ranked_posts.distance_meters asc,
      ranked_posts.created_at desc,
      ranked_posts.id asc
    limit least(greatest(coalesce(result_limit, 10), 1), 51)
  ),
  agree_counts as (
    select reaction.post_id, count(*)::int as agree_count
    from public.post_reactions as reaction
    inner join selected_posts on selected_posts.id = reaction.post_id
    where reaction.reaction_type = 'agree'
    group by reaction.post_id
  ),
  viewer_agrees as (
    select reaction.post_id
    from public.post_reactions as reaction
    inner join selected_posts on selected_posts.id = reaction.post_id
    where selected_posts.viewer_device_id is not null
      and reaction.reaction_type = 'agree'
      and reaction.device_id = selected_posts.viewer_device_id
    group by reaction.post_id
  ),
  with_replies as (
    select
      sp.*,
      c.name as reply_candidate_name,
      c.photo_url as reply_candidate_photo_url,
      c.local_council_district as reply_candidate_local_council_district,
      c.council_type as reply_candidate_council_type,
      r.content as reply_content,
      r.is_promise as reply_is_promise
    from selected_posts sp
    left join public.replies r on r.post_id = sp.id
    left join public.candidates c on c.id = r.candidate_id
  )
  select
    wr.id,
    wr.public_uuid,
    wr.content,
    wr.administrative_dong_name,
    wr.created_at,
    wr.delete_expires_at,
    wr.latitude,
    wr.longitude,
    wr.distance_meters,
    coalesce(agree_counts.agree_count, 0) as agree_count,
    coalesce(viewer_agrees.post_id is not null, false) as my_agree,
    case when wr.has_viewer_identity = false then false else true end as can_report,
    wr.reply_status,
    wr.reply_candidate_name,
    wr.reply_candidate_photo_url,
    wr.reply_candidate_local_council_district,
    wr.reply_candidate_council_type,
    wr.reply_content,
    wr.reply_is_promise
  from with_replies wr
  left join agree_counts on agree_counts.post_id = wr.id
  left join viewer_agrees on viewer_agrees.post_id = wr.id
  order by
    -- 내 선거구 후보 답변 우선
    case
      when wr.reply_status = 'replied'
        and wr.reply_candidate_local_council_district is not null
        and viewer_local_council_district is not null
        and wr.reply_candidate_local_council_district = viewer_local_council_district
      then 0
      when wr.reply_status = 'replied'
        and wr.reply_candidate_local_council_district is not null
        and viewer_metro_council_district is not null
        and wr.reply_candidate_local_council_district = viewer_metro_council_district
      then 1
      else 2
    end asc,
    case when wr.reply_status = 'replied' then 0 else 1 end asc,
    wr.distance_meters asc,
    wr.created_at desc,
    wr.id asc;
$func$;

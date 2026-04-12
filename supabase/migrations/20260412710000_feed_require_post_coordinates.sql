-- Public feed: omit posts with no stored latitude/longitude (e.g. candidate first messages).

create or replace function public.list_posts_feed(
  viewer_latitude double precision default null,
  viewer_longitude double precision default null,
  viewer_anonymous_device_id text default null,
  cursor_distance_meters integer default null,
  cursor_created_at timestamptz default null,
  cursor_post_id uuid default null,
  result_limit integer default 10
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
  reply_status text
)
language sql
stable
as $$
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
            power(
              p.latitude_bucket_100m - viewer.viewer_latitude_bucket_100m,
              2
            ) +
            power(
              p.longitude_bucket_100m - viewer.viewer_longitude_bucket_100m,
              2
            )
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
        or (
          ranked_posts.distance_meters = cursor_distance_meters
          and ranked_posts.created_at < cursor_created_at
        )
        or (
          ranked_posts.distance_meters = cursor_distance_meters
          and ranked_posts.created_at = cursor_created_at
          and ranked_posts.id > cursor_post_id
        )
      )
    order by ranked_posts.distance_meters asc, ranked_posts.created_at desc, ranked_posts.id asc
    limit least(greatest(coalesce(result_limit, 10), 1), 51)
  ),
  agree_counts as (
    select
      reaction.post_id,
      count(*)::int as agree_count
    from public.post_reactions as reaction
    inner join selected_posts
      on selected_posts.id = reaction.post_id
    where reaction.reaction_type = 'agree'
    group by reaction.post_id
  ),
  viewer_agrees as (
    select reaction.post_id
    from public.post_reactions as reaction
    inner join selected_posts
      on selected_posts.id = reaction.post_id
    where selected_posts.viewer_device_id is not null
      and reaction.reaction_type = 'agree'
      and reaction.device_id = selected_posts.viewer_device_id
    group by reaction.post_id
  )
  select
    selected_posts.id,
    selected_posts.public_uuid,
    selected_posts.content,
    selected_posts.administrative_dong_name,
    selected_posts.created_at,
    selected_posts.delete_expires_at,
    selected_posts.latitude,
    selected_posts.longitude,
    selected_posts.distance_meters,
    coalesce(agree_counts.agree_count, 0) as agree_count,
    coalesce(viewer_agrees.post_id is not null, false) as my_agree,
    case
      when selected_posts.has_viewer_identity = false then false
      else true
    end as can_report,
    selected_posts.reply_status
  from selected_posts
  left join agree_counts
    on agree_counts.post_id = selected_posts.id
  left join viewer_agrees
    on viewer_agrees.post_id = selected_posts.id
  order by selected_posts.distance_meters asc, selected_posts.created_at desc, selected_posts.id asc;
$$;

create or replace function public.list_nearby_posts(
  viewer_latitude double precision default null,
  viewer_longitude double precision default null,
  cursor_distance_meters integer default null,
  cursor_created_at timestamptz default null,
  cursor_post_id uuid default null,
  result_limit integer default 10
)
returns table (
  id uuid,
  content varchar(100),
  administrative_dong_name text,
  created_at timestamptz,
  delete_expires_at timestamptz,
  latitude double precision,
  longitude double precision,
  distance_meters integer
)
language sql
stable
as $$
  with viewer as (
    select
      viewer_latitude as latitude,
      viewer_longitude as longitude
  ),
  ranked_posts as (
    select
      p.id,
      p.content,
      p.administrative_dong_name,
      p.created_at,
      p.delete_expires_at,
      p.latitude,
      p.longitude,
      case
        when viewer.latitude is null
          or viewer.longitude is null
          or p.latitude is null
          or p.longitude is null then 2147483647
        else round(
          2 * 6371000 * asin(
            sqrt(
              power(sin(radians((p.latitude - viewer.latitude) / 2)), 2) +
              cos(radians(viewer.latitude)) *
              cos(radians(p.latitude)) *
              power(sin(radians((p.longitude - viewer.longitude) / 2)), 2)
            )
          )
        )::integer
      end as distance_meters
    from public.posts as p
    cross join viewer
    where p.status = 'active'
      and p.latitude is not null
      and p.longitude is not null
  )
  select
    ranked_posts.id,
    ranked_posts.content,
    ranked_posts.administrative_dong_name,
    ranked_posts.created_at,
    ranked_posts.delete_expires_at,
    ranked_posts.latitude,
    ranked_posts.longitude,
    ranked_posts.distance_meters
  from ranked_posts
  where
    cursor_distance_meters is null
    or ranked_posts.distance_meters > cursor_distance_meters
    or (
      ranked_posts.distance_meters = cursor_distance_meters
      and ranked_posts.created_at < cursor_created_at
    )
    or (
      ranked_posts.distance_meters = cursor_distance_meters
      and ranked_posts.created_at = cursor_created_at
      and ranked_posts.id > cursor_post_id
    )
  order by ranked_posts.distance_meters asc, ranked_posts.created_at desc, ranked_posts.id asc
  limit least(greatest(coalesce(result_limit, 10), 1), 51);
$$;

create or replace function public.list_posts_feed_v2(
  viewer_latitude double precision default null,
  viewer_longitude double precision default null,
  viewer_anonymous_device_id text default null,
  sort_mode text default 'agree',
  cursor_score double precision default null,
  cursor_created_at timestamptz default null,
  cursor_post_id uuid default null,
  result_limit integer default 10
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
  is_pinned boolean,
  author_type text,
  decay_score double precision,
  reply_candidate_name text,
  reply_content varchar(200),
  reply_is_promise boolean
)
language sql
stable
as $$
  with
  feed_settings as (
    select
      coalesce((select value::double precision from public.settings where key = 'decay_half_life_hours'), 72.0) as half_life,
      coalesce((select value::integer from public.settings where key = 'highlight_threshold'), 3) as highlight_thresh
  ),
  viewer as (
    select
      case
        when viewer_latitude is null then null
        else round((viewer_latitude * 111320.0) / 100.0)::integer
      end as viewer_latitude_bucket_100m,
      case
        when viewer_latitude is null or viewer_longitude is null then null
        else round(
          (viewer_longitude * greatest(111320.0 * cos(radians(viewer_latitude)), 0.000001)) / 100.0
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
  scored_posts as (
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
      p.is_pinned,
      p.author_type,
      viewer.viewer_device_id,
      viewer.has_viewer_identity,
      coalesce(ev.agree_count, 0)::integer as agree_count,
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
      end as distance_meters,
      coalesce(ev.agree_count, 0)::double precision /
        (1.0 + extract(epoch from (now() - p.created_at)) / 3600.0 / fs.half_life) as decay_score
    from public.posts p
    cross join viewer
    cross join feed_settings fs
    left join public.post_engagement_view ev on ev.post_id = p.id
    where p.status = 'active'
      and p.latitude is not null
      and p.longitude is not null
  ),
  filtered_posts as (
    select sp.*
    from scored_posts sp
    left join viewer_reported_posts vrp on vrp.post_id = sp.id
    where vrp.post_id is null
  ),
  selected_posts as (
    select fp.*
    from filtered_posts fp
    order by
      fp.is_pinned desc,
      case when sort_mode = 'agree' then fp.decay_score else null end desc nulls last,
      fp.distance_meters asc,
      fp.created_at desc,
      fp.id asc
    limit least(greatest(coalesce(result_limit, 10), 1), 51)
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
    wr.agree_count,
    coalesce(va.post_id is not null, false) as my_agree,
    case when wr.has_viewer_identity = false then false else true end as can_report,
    wr.reply_status,
    wr.is_pinned,
    wr.author_type,
    wr.decay_score,
    wr.reply_candidate_name,
    wr.reply_content,
    wr.reply_is_promise
  from with_replies wr
  left join viewer_agrees va on va.post_id = wr.id
  order by
    wr.is_pinned desc,
    case when sort_mode = 'agree' then wr.decay_score else null end desc nulls last,
    wr.distance_meters asc,
    wr.created_at desc,
    wr.id asc;
$$;

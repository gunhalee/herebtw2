do $$
declare
  existing_signature text;
begin
  for existing_signature in
    select oid::regprocedure::text
    from pg_proc
    where proname = 'list_posts_feed'
      and pronamespace = 'public'::regnamespace
  loop
    execute 'drop function if exists ' || existing_signature || ' cascade';
  end loop;
end $$;

create function public.list_posts_feed(
  viewer_latitude double precision default null,
  viewer_longitude double precision default null,
  viewer_anonymous_device_id text default null,
  cursor_priority_group integer default null,
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
  distance_sort_meters integer,
  agree_count integer,
  my_agree boolean,
  can_report boolean,
  reply_status text,
  reply_candidate_name text,
  reply_candidate_photo_url text,
  reply_candidate_local_council_district text,
  reply_candidate_council_type text,
  reply_content varchar(200),
  reply_is_promise boolean,
  priority_group integer
)
language sql
stable
as $$
  with viewer as (
    select
      case
        when viewer_latitude is null or viewer_longitude is null then null
        else point(
          round(
            (
              viewer_longitude *
              greatest(111320.0 * cos(radians(viewer_latitude)), 0.000001)
            ) / 100.0
          )::double precision,
          round((viewer_latitude * 111320.0) / 100.0)::double precision
        )
      end as viewer_bucket_point,
      device.id as viewer_device_id,
      viewer_anonymous_device_id is not null as has_viewer_identity
    from (select 1) as seed
    left join public.device_identities as device
      on device.anonymous_device_id = viewer_anonymous_device_id
  ),
  viewer_reported_posts as (
    select report.post_id
    from public.post_reports as report
    cross join viewer
    where viewer.viewer_device_id is not null
      and report.reporter_device_id = viewer.viewer_device_id
  ),
  local_replied_posts as (
    select
      projection.post_id as id,
      projection.public_uuid,
      projection.content,
      projection.administrative_dong_name,
      projection.created_at,
      projection.delete_expires_at,
      projection.latitude,
      projection.longitude,
      case
        when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
        else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
      end as distance_sort_meters,
      projection.agree_count,
      projection.reply_status,
      projection.latest_reply_candidate_name as reply_candidate_name,
      projection.latest_reply_candidate_photo_url as reply_candidate_photo_url,
      projection.latest_reply_candidate_local_council_district as reply_candidate_local_council_district,
      projection.latest_reply_candidate_council_type as reply_candidate_council_type,
      projection.latest_reply_content as reply_content,
      projection.latest_reply_is_promise as reply_is_promise,
      viewer.viewer_device_id,
      viewer.has_viewer_identity,
      0 as priority_group
    from public.post_feed_projection as projection
    cross join viewer
    where viewer_local_council_district is not null
      and projection.reply_status = 'replied'
      and projection.latest_reply_candidate_local_council_district = viewer_local_council_district
      and not exists (
        select 1
        from viewer_reported_posts as reported
        where reported.post_id = projection.post_id
      )
      and (
        cursor_priority_group is null
        or 0 > cursor_priority_group
        or (
          0 = cursor_priority_group
          and (
            cursor_distance_meters is null
            or (
              case
                when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
              end
            ) > cursor_distance_meters
            or (
              (
                case
                  when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                  else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
                end
              ) = cursor_distance_meters
              and projection.created_at < cursor_created_at
            )
            or (
              (
                case
                  when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                  else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
                end
              ) = cursor_distance_meters
              and projection.created_at = cursor_created_at
              and projection.post_id > cursor_post_id
            )
          )
        )
      )
    order by
      projection.location_bucket_point <-> viewer.viewer_bucket_point asc nulls last,
      projection.created_at desc,
      projection.post_id asc
    limit least(greatest(coalesce(result_limit, 10), 1), 51)
  ),
  metro_replied_posts as (
    select
      projection.post_id as id,
      projection.public_uuid,
      projection.content,
      projection.administrative_dong_name,
      projection.created_at,
      projection.delete_expires_at,
      projection.latitude,
      projection.longitude,
      case
        when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
        else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
      end as distance_sort_meters,
      projection.agree_count,
      projection.reply_status,
      projection.latest_reply_candidate_name as reply_candidate_name,
      projection.latest_reply_candidate_photo_url as reply_candidate_photo_url,
      projection.latest_reply_candidate_local_council_district as reply_candidate_local_council_district,
      projection.latest_reply_candidate_council_type as reply_candidate_council_type,
      projection.latest_reply_content as reply_content,
      projection.latest_reply_is_promise as reply_is_promise,
      viewer.viewer_device_id,
      viewer.has_viewer_identity,
      1 as priority_group
    from public.post_feed_projection as projection
    cross join viewer
    where viewer_metro_council_district is not null
      and projection.reply_status = 'replied'
      and projection.latest_reply_candidate_metro_council_district = viewer_metro_council_district
      and (
        viewer_local_council_district is null
        or projection.latest_reply_candidate_local_council_district is distinct from viewer_local_council_district
      )
      and not exists (
        select 1
        from viewer_reported_posts as reported
        where reported.post_id = projection.post_id
      )
      and (
        cursor_priority_group is null
        or 1 > cursor_priority_group
        or (
          1 = cursor_priority_group
          and (
            cursor_distance_meters is null
            or (
              case
                when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
              end
            ) > cursor_distance_meters
            or (
              (
                case
                  when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                  else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
                end
              ) = cursor_distance_meters
              and projection.created_at < cursor_created_at
            )
            or (
              (
                case
                  when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                  else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
                end
              ) = cursor_distance_meters
              and projection.created_at = cursor_created_at
              and projection.post_id > cursor_post_id
            )
          )
        )
      )
    order by
      projection.location_bucket_point <-> viewer.viewer_bucket_point asc nulls last,
      projection.created_at desc,
      projection.post_id asc
    limit least(greatest(coalesce(result_limit, 10), 1), 51)
  ),
  other_replied_posts as (
    select
      projection.post_id as id,
      projection.public_uuid,
      projection.content,
      projection.administrative_dong_name,
      projection.created_at,
      projection.delete_expires_at,
      projection.latitude,
      projection.longitude,
      case
        when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
        else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
      end as distance_sort_meters,
      projection.agree_count,
      projection.reply_status,
      projection.latest_reply_candidate_name as reply_candidate_name,
      projection.latest_reply_candidate_photo_url as reply_candidate_photo_url,
      projection.latest_reply_candidate_local_council_district as reply_candidate_local_council_district,
      projection.latest_reply_candidate_council_type as reply_candidate_council_type,
      projection.latest_reply_content as reply_content,
      projection.latest_reply_is_promise as reply_is_promise,
      viewer.viewer_device_id,
      viewer.has_viewer_identity,
      2 as priority_group
    from public.post_feed_projection as projection
    cross join viewer
    where projection.reply_status = 'replied'
      and (
        viewer_local_council_district is null
        or projection.latest_reply_candidate_local_council_district is distinct from viewer_local_council_district
      )
      and (
        viewer_metro_council_district is null
        or projection.latest_reply_candidate_metro_council_district is distinct from viewer_metro_council_district
      )
      and not exists (
        select 1
        from viewer_reported_posts as reported
        where reported.post_id = projection.post_id
      )
      and (
        cursor_priority_group is null
        or 2 > cursor_priority_group
        or (
          2 = cursor_priority_group
          and (
            cursor_distance_meters is null
            or (
              case
                when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
              end
            ) > cursor_distance_meters
            or (
              (
                case
                  when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                  else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
                end
              ) = cursor_distance_meters
              and projection.created_at < cursor_created_at
            )
            or (
              (
                case
                  when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                  else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
                end
              ) = cursor_distance_meters
              and projection.created_at = cursor_created_at
              and projection.post_id > cursor_post_id
            )
          )
        )
      )
    order by
      projection.location_bucket_point <-> viewer.viewer_bucket_point asc nulls last,
      projection.created_at desc,
      projection.post_id asc
    limit least(greatest(coalesce(result_limit, 10), 1), 51)
  ),
  unreplied_posts as (
    select
      projection.post_id as id,
      projection.public_uuid,
      projection.content,
      projection.administrative_dong_name,
      projection.created_at,
      projection.delete_expires_at,
      projection.latitude,
      projection.longitude,
      case
        when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
        else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
      end as distance_sort_meters,
      projection.agree_count,
      projection.reply_status,
      projection.latest_reply_candidate_name as reply_candidate_name,
      projection.latest_reply_candidate_photo_url as reply_candidate_photo_url,
      projection.latest_reply_candidate_local_council_district as reply_candidate_local_council_district,
      projection.latest_reply_candidate_council_type as reply_candidate_council_type,
      projection.latest_reply_content as reply_content,
      projection.latest_reply_is_promise as reply_is_promise,
      viewer.viewer_device_id,
      viewer.has_viewer_identity,
      3 as priority_group
    from public.post_feed_projection as projection
    cross join viewer
    where projection.reply_status <> 'replied'
      and not exists (
        select 1
        from viewer_reported_posts as reported
        where reported.post_id = projection.post_id
      )
      and (
        cursor_priority_group is null
        or 3 > cursor_priority_group
        or (
          3 = cursor_priority_group
          and (
            cursor_distance_meters is null
            or (
              case
                when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
              end
            ) > cursor_distance_meters
            or (
              (
                case
                  when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                  else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
                end
              ) = cursor_distance_meters
              and projection.created_at < cursor_created_at
            )
            or (
              (
                case
                  when viewer.viewer_bucket_point is null or projection.location_bucket_point is null then 2147483647
                  else ceil((projection.location_bucket_point <-> viewer.viewer_bucket_point) * 100.0)::integer
                end
              ) = cursor_distance_meters
              and projection.created_at = cursor_created_at
              and projection.post_id > cursor_post_id
            )
          )
        )
      )
    order by
      projection.location_bucket_point <-> viewer.viewer_bucket_point asc nulls last,
      projection.created_at desc,
      projection.post_id asc
    limit least(greatest(coalesce(result_limit, 10), 1), 51)
  ),
  selected_posts as (
    select
      unioned_posts.*,
      case
        when viewer_latitude is null
          or viewer_longitude is null
          or unioned_posts.latitude is null
          or unioned_posts.longitude is null then 2147483647
        else round(
          2 * 6371000 * asin(
            least(
              1.0,
              sqrt(
                power(sin(radians((unioned_posts.latitude - viewer_latitude) / 2)), 2) +
                cos(radians(viewer_latitude)) *
                  cos(radians(unioned_posts.latitude)) *
                  power(sin(radians((unioned_posts.longitude - viewer_longitude) / 2)), 2)
              )
            )
          )
        )::integer
      end as distance_meters
    from (
      select * from local_replied_posts
      union all
      select * from metro_replied_posts
      union all
      select * from other_replied_posts
      union all
      select * from unreplied_posts
    ) as unioned_posts
    order by
      priority_group asc,
      distance_sort_meters asc,
      created_at desc,
      id asc
    limit least(greatest(coalesce(result_limit, 10), 1), 51)
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
    selected_posts.distance_sort_meters,
    selected_posts.agree_count,
    coalesce(viewer_agrees.post_id is not null, false) as my_agree,
    case
      when selected_posts.has_viewer_identity = false then false
      else true
    end as can_report,
    selected_posts.reply_status,
    selected_posts.reply_candidate_name,
    selected_posts.reply_candidate_photo_url,
    selected_posts.reply_candidate_local_council_district,
    selected_posts.reply_candidate_council_type,
    selected_posts.reply_content,
    selected_posts.reply_is_promise,
    selected_posts.priority_group
  from selected_posts
  left join viewer_agrees
    on viewer_agrees.post_id = selected_posts.id
  order by
    selected_posts.priority_group asc,
    selected_posts.distance_sort_meters asc,
    selected_posts.created_at desc,
    selected_posts.id asc;
$$;

notify pgrst, 'reload schema';

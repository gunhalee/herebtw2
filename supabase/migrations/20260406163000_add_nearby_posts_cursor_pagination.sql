drop function if exists public.list_nearby_posts(
  double precision,
  double precision,
  integer
);

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
  with ranked_posts as (
    select
      p.id,
      p.content,
      p.administrative_dong_name,
      p.created_at,
      p.delete_expires_at,
      p.latitude,
      p.longitude,
      case
        when viewer_latitude is null
          or viewer_longitude is null
          or p.latitude is null
          or p.longitude is null then 2147483647
        else round(
          2 * 6371000 * asin(
            sqrt(
              power(sin(radians((p.latitude - viewer_latitude) / 2)), 2) +
              cos(radians(viewer_latitude)) *
              cos(radians(p.latitude)) *
              power(sin(radians((p.longitude - viewer_longitude) / 2)), 2)
            )
          )
        )::integer
      end as distance_meters
    from public.posts p
    where p.status = 'active'
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

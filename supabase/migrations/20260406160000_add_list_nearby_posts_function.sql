create or replace function public.list_nearby_posts(
  viewer_latitude double precision,
  viewer_longitude double precision,
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
  select
    p.id,
    p.content,
    p.administrative_dong_name,
    p.created_at,
    p.delete_expires_at,
    p.latitude,
    p.longitude,
    case
      when p.latitude is null or p.longitude is null then 2147483647
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
  order by distance_meters asc, p.created_at desc
  limit least(greatest(coalesce(result_limit, 10), 1), 50);
$$;

create table if not exists public.post_feed_projection (
  post_id uuid primary key references public.posts(id) on delete cascade,
  public_uuid uuid not null unique,
  content varchar(100) not null,
  administrative_dong_name text not null,
  created_at timestamptz not null,
  delete_expires_at timestamptz not null,
  notification_email varchar(255),
  latitude double precision,
  longitude double precision,
  latitude_bucket_100m integer,
  longitude_bucket_100m integer,
  location_bucket_point point,
  reply_status text not null,
  agree_count integer not null default 0,
  reply_count integer not null default 0,
  latest_reply_id uuid,
  latest_reply_created_at timestamptz,
  latest_reply_candidate_id uuid,
  latest_reply_candidate_name varchar(50),
  latest_reply_candidate_photo_url text,
  latest_reply_candidate_district varchar(100),
  latest_reply_candidate_local_council_district text,
  latest_reply_candidate_metro_council_district text,
  latest_reply_candidate_council_type text,
  latest_reply_content varchar(200),
  latest_reply_is_promise boolean,
  latest_reply_promise_deadline date
);

create index if not exists idx_post_feed_projection_created_at
  on public.post_feed_projection (created_at desc, post_id asc);

create index if not exists idx_post_feed_projection_reply_status_created_at
  on public.post_feed_projection (reply_status, created_at desc, post_id asc);

create index if not exists idx_post_feed_projection_local_district
  on public.post_feed_projection (
    latest_reply_candidate_local_council_district,
    created_at desc,
    post_id asc
  )
  where latest_reply_candidate_local_council_district is not null;

create index if not exists idx_post_feed_projection_metro_district
  on public.post_feed_projection (
    latest_reply_candidate_metro_council_district,
    created_at desc,
    post_id asc
  )
  where latest_reply_candidate_metro_council_district is not null;

create index if not exists idx_post_feed_projection_location_bucket_point
  on public.post_feed_projection
  using gist (location_bucket_point)
  where location_bucket_point is not null;

create index if not exists idx_post_reports_reporter_device_post_id
  on public.post_reports (reporter_device_id, post_id);

create index if not exists idx_post_reactions_device_agree_post_id
  on public.post_reactions (device_id, post_id)
  where reaction_type = 'agree';

create or replace function public.refresh_post_feed_projection(target_post_id uuid)
returns void
language plpgsql
as $$
declare
  projection_row record;
begin
  if target_post_id is null then
    return;
  end if;

  select
    p.id as post_id,
    p.public_uuid,
    p.content,
    p.administrative_dong_name,
    p.created_at,
    p.delete_expires_at,
    p.notification_email,
    p.latitude,
    p.longitude,
    p.latitude_bucket_100m,
    p.longitude_bucket_100m,
    case
      when p.latitude_bucket_100m is null or p.longitude_bucket_100m is null then null
      else point(
        p.longitude_bucket_100m::double precision,
        p.latitude_bucket_100m::double precision
      )
    end as location_bucket_point,
    case
      when coalesce(reply_stats.reply_count, 0) > 0 then 'replied'
      else 'delivered'
    end as reply_status,
    coalesce(reaction_stats.agree_count, 0) as agree_count,
    coalesce(reply_stats.reply_count, 0) as reply_count,
    latest_reply.reply_id as latest_reply_id,
    latest_reply.reply_created_at as latest_reply_created_at,
    latest_reply.reply_candidate_id as latest_reply_candidate_id,
    latest_reply.reply_candidate_name as latest_reply_candidate_name,
    latest_reply.reply_candidate_photo_url as latest_reply_candidate_photo_url,
    latest_reply.reply_candidate_district as latest_reply_candidate_district,
    latest_reply.reply_candidate_local_council_district as latest_reply_candidate_local_council_district,
    latest_reply.reply_candidate_metro_council_district as latest_reply_candidate_metro_council_district,
    latest_reply.reply_candidate_council_type as latest_reply_candidate_council_type,
    latest_reply.reply_content as latest_reply_content,
    latest_reply.reply_is_promise as latest_reply_is_promise,
    latest_reply.reply_promise_deadline as latest_reply_promise_deadline
  into projection_row
  from public.posts as p
  left join lateral (
    select count(*)::int as agree_count
    from public.post_reactions as reaction
    where reaction.post_id = p.id
      and reaction.reaction_type = 'agree'
  ) as reaction_stats on true
  left join lateral (
    select count(*)::int as reply_count
    from public.replies as reply_count_source
    where reply_count_source.post_id = p.id
  ) as reply_stats on true
  left join lateral (
    select
      reply.id as reply_id,
      reply.created_at as reply_created_at,
      reply.candidate_id as reply_candidate_id,
      candidate.name as reply_candidate_name,
      candidate.photo_url as reply_candidate_photo_url,
      candidate.district as reply_candidate_district,
      candidate.local_council_district as reply_candidate_local_council_district,
      candidate.metro_council_district as reply_candidate_metro_council_district,
      candidate.council_type as reply_candidate_council_type,
      reply.content as reply_content,
      reply.is_promise as reply_is_promise,
      reply.promise_deadline as reply_promise_deadline
    from public.replies as reply
    left join public.candidates as candidate
      on candidate.id = reply.candidate_id
    where reply.post_id = p.id
    order by reply.created_at desc, reply.id desc
    limit 1
  ) as latest_reply on true
  where p.id = target_post_id
    and p.status = 'active';

  if not found then
    delete from public.post_feed_projection
    where post_id = target_post_id;
    return;
  end if;

  insert into public.post_feed_projection (
    post_id,
    public_uuid,
    content,
    administrative_dong_name,
    created_at,
    delete_expires_at,
    notification_email,
    latitude,
    longitude,
    latitude_bucket_100m,
    longitude_bucket_100m,
    location_bucket_point,
    reply_status,
    agree_count,
    reply_count,
    latest_reply_id,
    latest_reply_created_at,
    latest_reply_candidate_id,
    latest_reply_candidate_name,
    latest_reply_candidate_photo_url,
    latest_reply_candidate_district,
    latest_reply_candidate_local_council_district,
    latest_reply_candidate_metro_council_district,
    latest_reply_candidate_council_type,
    latest_reply_content,
    latest_reply_is_promise,
    latest_reply_promise_deadline
  )
  values (
    projection_row.post_id,
    projection_row.public_uuid,
    projection_row.content,
    projection_row.administrative_dong_name,
    projection_row.created_at,
    projection_row.delete_expires_at,
    projection_row.notification_email,
    projection_row.latitude,
    projection_row.longitude,
    projection_row.latitude_bucket_100m,
    projection_row.longitude_bucket_100m,
    projection_row.location_bucket_point,
    projection_row.reply_status,
    projection_row.agree_count,
    projection_row.reply_count,
    projection_row.latest_reply_id,
    projection_row.latest_reply_created_at,
    projection_row.latest_reply_candidate_id,
    projection_row.latest_reply_candidate_name,
    projection_row.latest_reply_candidate_photo_url,
    projection_row.latest_reply_candidate_district,
    projection_row.latest_reply_candidate_local_council_district,
    projection_row.latest_reply_candidate_metro_council_district,
    projection_row.latest_reply_candidate_council_type,
    projection_row.latest_reply_content,
    projection_row.latest_reply_is_promise,
    projection_row.latest_reply_promise_deadline
  )
  on conflict (post_id) do update
  set
    public_uuid = excluded.public_uuid,
    content = excluded.content,
    administrative_dong_name = excluded.administrative_dong_name,
    created_at = excluded.created_at,
    delete_expires_at = excluded.delete_expires_at,
    notification_email = excluded.notification_email,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    latitude_bucket_100m = excluded.latitude_bucket_100m,
    longitude_bucket_100m = excluded.longitude_bucket_100m,
    location_bucket_point = excluded.location_bucket_point,
    reply_status = excluded.reply_status,
    agree_count = excluded.agree_count,
    reply_count = excluded.reply_count,
    latest_reply_id = excluded.latest_reply_id,
    latest_reply_created_at = excluded.latest_reply_created_at,
    latest_reply_candidate_id = excluded.latest_reply_candidate_id,
    latest_reply_candidate_name = excluded.latest_reply_candidate_name,
    latest_reply_candidate_photo_url = excluded.latest_reply_candidate_photo_url,
    latest_reply_candidate_district = excluded.latest_reply_candidate_district,
    latest_reply_candidate_local_council_district = excluded.latest_reply_candidate_local_council_district,
    latest_reply_candidate_metro_council_district = excluded.latest_reply_candidate_metro_council_district,
    latest_reply_candidate_council_type = excluded.latest_reply_candidate_council_type,
    latest_reply_content = excluded.latest_reply_content,
    latest_reply_is_promise = excluded.latest_reply_is_promise,
    latest_reply_promise_deadline = excluded.latest_reply_promise_deadline;
end;
$$;

create or replace function public.sync_post_reply_status(target_post_id uuid)
returns void
language plpgsql
as $$
begin
  if target_post_id is null then
    return;
  end if;

  update public.posts as post
  set reply_status = case
    when exists (
      select 1
      from public.replies as reply
      where reply.post_id = target_post_id
    ) then 'replied'
    else 'delivered'
  end
  where post.id = target_post_id
    and post.status = 'active';
end;
$$;

create or replace function public.sync_post_feed_projection_after_post_change()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_post_feed_projection(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_posts_sync_post_feed_projection on public.posts;

create trigger trg_posts_sync_post_feed_projection
after insert or update of
  status,
  public_uuid,
  content,
  administrative_dong_name,
  created_at,
  delete_expires_at,
  notification_email,
  latitude,
  longitude,
  latitude_bucket_100m,
  longitude_bucket_100m
on public.posts
for each row
execute function public.sync_post_feed_projection_after_post_change();

drop trigger if exists trg_posts_delete_sync_post_feed_projection on public.posts;

create trigger trg_posts_delete_sync_post_feed_projection
after delete on public.posts
for each row
execute function public.sync_post_feed_projection_after_post_change();

create or replace function public.sync_post_feed_projection_after_reply_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_post_reply_status(old.post_id);
    perform public.refresh_post_feed_projection(old.post_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.post_id is distinct from new.post_id then
    perform public.sync_post_reply_status(old.post_id);
    perform public.refresh_post_feed_projection(old.post_id);
  end if;

  perform public.sync_post_reply_status(new.post_id);
  perform public.refresh_post_feed_projection(new.post_id);
  return new;
end;
$$;

drop trigger if exists trg_reply_update_post_status on public.replies;
drop trigger if exists trg_replies_sync_post_feed_projection on public.replies;

create trigger trg_replies_sync_post_feed_projection
after insert or update or delete on public.replies
for each row
execute function public.sync_post_feed_projection_after_reply_change();

create or replace function public.sync_post_feed_projection_after_reaction_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.reaction_type = 'agree' then
      update public.post_feed_projection
      set agree_count = agree_count + 1
      where post_id = new.post_id;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.reaction_type = 'agree' then
      update public.post_feed_projection
      set agree_count = greatest(agree_count - 1, 0)
      where post_id = old.post_id;
    end if;

    return old;
  end if;

  perform public.refresh_post_feed_projection(old.post_id);
  perform public.refresh_post_feed_projection(new.post_id);
  return new;
end;
$$;

drop trigger if exists trg_post_reactions_sync_post_feed_projection on public.post_reactions;

create trigger trg_post_reactions_sync_post_feed_projection
after insert or update or delete on public.post_reactions
for each row
execute function public.sync_post_feed_projection_after_reaction_change();

create or replace function public.sync_post_feed_projection_after_candidate_change()
returns trigger
language plpgsql
as $$
begin
  update public.post_feed_projection
  set
    latest_reply_candidate_name = new.name,
    latest_reply_candidate_photo_url = new.photo_url,
    latest_reply_candidate_district = new.district,
    latest_reply_candidate_local_council_district = new.local_council_district,
    latest_reply_candidate_metro_council_district = new.metro_council_district,
    latest_reply_candidate_council_type = new.council_type
  where latest_reply_candidate_id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_candidates_sync_post_feed_projection on public.candidates;

create trigger trg_candidates_sync_post_feed_projection
after update of
  name,
  photo_url,
  district,
  local_council_district,
  metro_council_district,
  council_type
on public.candidates
for each row
execute function public.sync_post_feed_projection_after_candidate_change();

update public.posts as post
set reply_status = case
  when exists (
    select 1
    from public.replies as reply
    where reply.post_id = post.id
  ) then 'replied'
  else 'delivered'
end
where post.status = 'active';

with projection_source as (
  select
    p.id as post_id,
    p.public_uuid,
    p.content,
    p.administrative_dong_name,
    p.created_at,
    p.delete_expires_at,
    p.notification_email,
    p.latitude,
    p.longitude,
    p.latitude_bucket_100m,
    p.longitude_bucket_100m,
    case
      when p.latitude_bucket_100m is null or p.longitude_bucket_100m is null then null
      else point(
        p.longitude_bucket_100m::double precision,
        p.latitude_bucket_100m::double precision
      )
    end as location_bucket_point,
    p.reply_status,
    coalesce(reaction_stats.agree_count, 0) as agree_count,
    coalesce(reply_stats.reply_count, 0) as reply_count,
    latest_reply.reply_id as latest_reply_id,
    latest_reply.reply_created_at as latest_reply_created_at,
    latest_reply.reply_candidate_id as latest_reply_candidate_id,
    latest_reply.reply_candidate_name as latest_reply_candidate_name,
    latest_reply.reply_candidate_photo_url as latest_reply_candidate_photo_url,
    latest_reply.reply_candidate_district as latest_reply_candidate_district,
    latest_reply.reply_candidate_local_council_district as latest_reply_candidate_local_council_district,
    latest_reply.reply_candidate_metro_council_district as latest_reply_candidate_metro_council_district,
    latest_reply.reply_candidate_council_type as latest_reply_candidate_council_type,
    latest_reply.reply_content as latest_reply_content,
    latest_reply.reply_is_promise as latest_reply_is_promise,
    latest_reply.reply_promise_deadline as latest_reply_promise_deadline
  from public.posts as p
  left join lateral (
    select count(*)::int as agree_count
    from public.post_reactions as reaction
    where reaction.post_id = p.id
      and reaction.reaction_type = 'agree'
  ) as reaction_stats on true
  left join lateral (
    select count(*)::int as reply_count
    from public.replies as reply_count_source
    where reply_count_source.post_id = p.id
  ) as reply_stats on true
  left join lateral (
    select
      reply.id as reply_id,
      reply.created_at as reply_created_at,
      reply.candidate_id as reply_candidate_id,
      candidate.name as reply_candidate_name,
      candidate.photo_url as reply_candidate_photo_url,
      candidate.district as reply_candidate_district,
      candidate.local_council_district as reply_candidate_local_council_district,
      candidate.metro_council_district as reply_candidate_metro_council_district,
      candidate.council_type as reply_candidate_council_type,
      reply.content as reply_content,
      reply.is_promise as reply_is_promise,
      reply.promise_deadline as reply_promise_deadline
    from public.replies as reply
    left join public.candidates as candidate
      on candidate.id = reply.candidate_id
    where reply.post_id = p.id
    order by reply.created_at desc, reply.id desc
    limit 1
  ) as latest_reply on true
  where p.status = 'active'
)
insert into public.post_feed_projection (
  post_id,
  public_uuid,
  content,
  administrative_dong_name,
  created_at,
  delete_expires_at,
  notification_email,
  latitude,
  longitude,
  latitude_bucket_100m,
  longitude_bucket_100m,
  location_bucket_point,
  reply_status,
  agree_count,
  reply_count,
  latest_reply_id,
  latest_reply_created_at,
  latest_reply_candidate_id,
  latest_reply_candidate_name,
  latest_reply_candidate_photo_url,
  latest_reply_candidate_district,
  latest_reply_candidate_local_council_district,
  latest_reply_candidate_metro_council_district,
  latest_reply_candidate_council_type,
  latest_reply_content,
  latest_reply_is_promise,
  latest_reply_promise_deadline
)
select
  post_id,
  public_uuid,
  content,
  administrative_dong_name,
  created_at,
  delete_expires_at,
  notification_email,
  latitude,
  longitude,
  latitude_bucket_100m,
  longitude_bucket_100m,
  location_bucket_point,
  reply_status,
  agree_count,
  reply_count,
  latest_reply_id,
  latest_reply_created_at,
  latest_reply_candidate_id,
  latest_reply_candidate_name,
  latest_reply_candidate_photo_url,
  latest_reply_candidate_district,
  latest_reply_candidate_local_council_district,
  latest_reply_candidate_metro_council_district,
  latest_reply_candidate_council_type,
  latest_reply_content,
  latest_reply_is_promise,
  latest_reply_promise_deadline
from projection_source
on conflict (post_id) do update
set
  public_uuid = excluded.public_uuid,
  content = excluded.content,
  administrative_dong_name = excluded.administrative_dong_name,
  created_at = excluded.created_at,
  delete_expires_at = excluded.delete_expires_at,
  notification_email = excluded.notification_email,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  latitude_bucket_100m = excluded.latitude_bucket_100m,
  longitude_bucket_100m = excluded.longitude_bucket_100m,
  location_bucket_point = excluded.location_bucket_point,
  reply_status = excluded.reply_status,
  agree_count = excluded.agree_count,
  reply_count = excluded.reply_count,
  latest_reply_id = excluded.latest_reply_id,
  latest_reply_created_at = excluded.latest_reply_created_at,
  latest_reply_candidate_id = excluded.latest_reply_candidate_id,
  latest_reply_candidate_name = excluded.latest_reply_candidate_name,
  latest_reply_candidate_photo_url = excluded.latest_reply_candidate_photo_url,
  latest_reply_candidate_district = excluded.latest_reply_candidate_district,
  latest_reply_candidate_local_council_district = excluded.latest_reply_candidate_local_council_district,
  latest_reply_candidate_metro_council_district = excluded.latest_reply_candidate_metro_council_district,
  latest_reply_candidate_council_type = excluded.latest_reply_candidate_council_type,
  latest_reply_content = excluded.latest_reply_content,
  latest_reply_is_promise = excluded.latest_reply_is_promise,
  latest_reply_promise_deadline = excluded.latest_reply_promise_deadline;

create or replace view public.post_engagement_view as
select
  projection.post_id,
  projection.agree_count
from public.post_feed_projection as projection;

drop function if exists public.toggle_post_agree(uuid, text);

create function public.toggle_post_agree(
  target_post_id uuid,
  viewer_anonymous_device_id text
)
returns table (
  agreed boolean,
  agree_count integer
)
language plpgsql
security definer
as $$
declare
  viewer_device_id uuid;
  deleted_reaction_count integer;
  current_agree_count integer;
begin
  if viewer_anonymous_device_id is null
    or btrim(viewer_anonymous_device_id) = '' then
    raise exception 'INVALID_DEVICE_ID';
  end if;

  insert into public.device_identities (anonymous_device_id)
  values (viewer_anonymous_device_id)
  on conflict (anonymous_device_id)
  do update set last_seen_at = now()
  returning id into viewer_device_id;

  if not exists (
    select 1
    from public.posts as post
    where post.id = target_post_id
      and post.status = 'active'
  ) then
    return query
      select false, 0;
    return;
  end if;

  with deleted_reactions as (
    delete from public.post_reactions as reaction
    where reaction.post_id = target_post_id
      and reaction.device_id = viewer_device_id
      and reaction.reaction_type = 'agree'
    returning reaction.id
  )
  select count(*)::int
  into deleted_reaction_count
  from deleted_reactions;

  if deleted_reaction_count > 0 then
    select coalesce(projection.agree_count, 0)
    into current_agree_count
    from public.post_feed_projection as projection
    where projection.post_id = target_post_id;

    return query
      select false, coalesce(current_agree_count, 0);
    return;
  end if;

  insert into public.post_reactions (
    post_id,
    device_id,
    reaction_type
  )
  values (
    target_post_id,
    viewer_device_id,
    'agree'
  )
  on conflict (post_id, device_id, reaction_type) do nothing;

  select coalesce(projection.agree_count, 0)
  into current_agree_count
  from public.post_feed_projection as projection
  where projection.post_id = target_post_id;

  return query
    select true, coalesce(current_agree_count, 0);
end;
$$;

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
      end as distance_meters,
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
      end as distance_meters,
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
      end as distance_meters,
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
      end as distance_meters,
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
    select *
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
      distance_meters asc,
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
    selected_posts.distance_meters asc,
    selected_posts.created_at desc,
    selected_posts.id asc;
$$;

drop function if exists public.get_post_by_uuid(uuid);

create function public.get_post_by_uuid(target_uuid uuid)
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
    projection.post_id as id,
    projection.public_uuid,
    projection.content,
    projection.administrative_dong_name,
    projection.created_at,
    projection.reply_status,
    projection.agree_count,
    projection.notification_email,
    projection.latest_reply_id as reply_id,
    projection.latest_reply_candidate_name as reply_candidate_name,
    projection.latest_reply_candidate_district as reply_candidate_district,
    projection.latest_reply_candidate_local_council_district as reply_candidate_local_council_district,
    projection.latest_reply_candidate_metro_council_district as reply_candidate_metro_council_district,
    projection.latest_reply_candidate_council_type as reply_candidate_council_type,
    projection.latest_reply_content as reply_content,
    projection.latest_reply_is_promise as reply_is_promise,
    projection.latest_reply_promise_deadline as reply_promise_deadline,
    projection.latest_reply_created_at as reply_created_at
  from public.post_feed_projection as projection
  where projection.public_uuid = target_uuid
  limit 1;
$$;

notify pgrst, 'reload schema';

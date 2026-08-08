create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

alter table public.device_identities
  add column if not exists token_version smallint not null default 1,
  add column if not exists revoked_at timestamptz,
  add column if not exists risk_level text not null default 'normal',
  add column if not exists last_restricted_at timestamptz;

alter table public.device_identities
  drop constraint if exists device_identities_risk_level_check;

alter table public.device_identities
  add constraint device_identities_risk_level_check
  check (risk_level in ('normal', 'watch', 'restricted'));

alter table public.posts
  add column if not exists client_request_id uuid,
  add column if not exists normalized_content_strict text,
  add column if not exists normalized_content_loose text,
  add column if not exists content_fingerprint text,
  add column if not exists fingerprint_version smallint not null default 1;

update public.posts
set
  normalized_content_strict = btrim(
    regexp_replace(
      lower(
        translate(
          normalize(content, NFKC),
          chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279),
          ''
        )
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  ),
  normalized_content_loose = regexp_replace(
    btrim(
      regexp_replace(
        lower(
          translate(
            normalize(content, NFKC),
            chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279),
            ''
          )
        ),
        '[[:space:]]+',
        ' ',
        'g'
      )
    ),
    '[[:punct:][:space:]]+',
    '',
    'g'
  )
where normalized_content_strict is null
   or normalized_content_loose is null;

update public.posts
set content_fingerprint = encode(
  digest(convert_to(normalized_content_strict, 'UTF8'), 'sha256'),
  'hex'
)
where content_fingerprint is null
  and normalized_content_strict is not null;

alter table public.posts
  drop constraint if exists posts_status_check;

alter table public.posts
  add constraint posts_status_check
  check (status in ('active', 'quarantined', 'hidden', 'deleted'));

create unique index if not exists uq_posts_device_client_request
  on public.posts (author_device_id, client_request_id)
  where author_device_id is not null and client_request_id is not null;

create unique index if not exists uq_posts_device_visible_fingerprint
  on public.posts (author_device_id, content_fingerprint)
  where author_device_id is not null
    and content_fingerprint is not null
    and status in ('active', 'quarantined');

create index if not exists idx_posts_device_recent_fingerprints
  on public.posts (author_device_id, created_at desc)
  where author_device_id is not null
    and status in ('active', 'quarantined');

create index if not exists idx_posts_normalized_content_loose_trgm
  on public.posts using gin (normalized_content_loose extensions.gin_trgm_ops)
  where status in ('active', 'quarantined');

create table if not exists public.abuse_rate_windows (
  subject_kind text not null,
  subject_hash text not null,
  action text not null,
  window_started_at timestamptz not null,
  window_seconds integer not null,
  request_count integer not null default 0,
  expires_at timestamptz not null,
  primary key (
    subject_kind,
    subject_hash,
    action,
    window_started_at,
    window_seconds
  ),
  constraint abuse_rate_windows_subject_kind_check
    check (subject_kind in ('device', 'network', 'account')),
  constraint abuse_rate_windows_subject_hash_length_check
    check (char_length(subject_hash) between 16 and 128),
  constraint abuse_rate_windows_window_seconds_check
    check (window_seconds between 1 and 86400),
  constraint abuse_rate_windows_request_count_check
    check (request_count >= 0)
);

create index if not exists idx_abuse_rate_windows_expires_at
  on public.abuse_rate_windows (expires_at);

alter table public.abuse_logs
  add column if not exists action text,
  add column if not exists decision text,
  add column if not exists reason_code text,
  add column if not exists subject_hash text,
  add column if not exists expires_at timestamptz
    default (now() + interval '90 days');

create index if not exists idx_abuse_logs_expires_at
  on public.abuse_logs (expires_at);

create index if not exists idx_abuse_logs_device_created_at
  on public.abuse_logs (device_id, created_at desc)
  where device_id is not null;

alter table public.device_identities enable row level security;
alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_reports enable row level security;
alter table public.abuse_logs enable row level security;
alter table public.abuse_rate_windows enable row level security;

create or replace function public.consume_abuse_budget(
  p_subject_kind text,
  p_subject_hash text,
  p_action text,
  p_window_seconds integer,
  p_request_limit integer
)
returns table (
  allowed boolean,
  request_count integer,
  retry_after_seconds integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_timestamp timestamptz := clock_timestamp();
  bucket_start timestamptz;
  next_count integer;
  bucket_end timestamptz;
begin
  if p_subject_kind not in ('device', 'network', 'account')
    or p_subject_hash is null
    or char_length(p_subject_hash) not between 16 and 128
    or p_action is null
    or btrim(p_action) = ''
    or p_window_seconds not between 1 and 86400
    or p_request_limit < 1 then
    raise exception 'INVALID_ABUSE_BUDGET_INPUT';
  end if;

  bucket_start := to_timestamp(
    floor(extract(epoch from request_timestamp) / p_window_seconds)
      * p_window_seconds
  );
  bucket_end := bucket_start + make_interval(secs => p_window_seconds);

  insert into public.abuse_rate_windows (
    subject_kind,
    subject_hash,
    action,
    window_started_at,
    window_seconds,
    request_count,
    expires_at
  )
  values (
    p_subject_kind,
    p_subject_hash,
    p_action,
    bucket_start,
    p_window_seconds,
    1,
    bucket_end + interval '48 hours'
  )
  on conflict (
    subject_kind,
    subject_hash,
    action,
    window_started_at,
    window_seconds
  )
  do update set
    request_count = public.abuse_rate_windows.request_count + 1,
    expires_at = greatest(
      public.abuse_rate_windows.expires_at,
      excluded.expires_at
    )
  returning public.abuse_rate_windows.request_count into next_count;

  return query select
    next_count <= p_request_limit,
    next_count,
    case
      when next_count <= p_request_limit then 0
      else greatest(
        1,
        ceil(extract(epoch from bucket_end - request_timestamp))::integer
      )
    end;
end;
$$;

create or replace function public.toggle_post_agree_for_device(
  target_post_id uuid,
  viewer_device_id uuid
)
returns table (
  agreed boolean,
  agree_count integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_reaction_count integer;
  current_agree_count integer;
begin
  if viewer_device_id is null then
    raise exception 'INVALID_DEVICE_ID';
  end if;

  if not exists (
    select 1
    from public.posts as post
    where post.id = target_post_id
      and post.status = 'active'
  ) then
    return query select false, 0;
    return;
  end if;

  with deleted_reactions as (
    delete from public.post_reactions as reaction
    where reaction.post_id = target_post_id
      and reaction.device_id = viewer_device_id
      and reaction.reaction_type = 'agree'
    returning reaction.id
  )
  select count(*)::integer
  into deleted_reaction_count
  from deleted_reactions;

  if deleted_reaction_count = 0 then
    insert into public.post_reactions (post_id, device_id, reaction_type)
    values (target_post_id, viewer_device_id, 'agree')
    on conflict (post_id, device_id, reaction_type) do nothing;
  end if;

  select count(*)::integer
  into current_agree_count
  from public.post_reactions as reaction
  where reaction.post_id = target_post_id
    and reaction.reaction_type = 'agree';

  return query select
    deleted_reaction_count = 0,
    coalesce(current_agree_count, 0);
end;
$$;

create or replace function public.find_similar_recent_posts(
  p_device_id uuid,
  p_normalized_content text,
  p_since timestamptz default (now() - interval '24 hours'),
  p_limit integer default 10
)
returns table (
  post_id uuid,
  same_device boolean,
  similarity_score real
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    post.id as post_id,
    post.author_device_id = p_device_id as same_device,
    extensions.similarity(
      post.normalized_content_loose,
      p_normalized_content
    ) as similarity_score
  from public.posts as post
  where post.status in ('active', 'quarantined')
    and post.created_at >= p_since
    and post.normalized_content_loose is not null
    and char_length(p_normalized_content) >= 6
    and extensions.similarity(
      post.normalized_content_loose,
      p_normalized_content
    ) >= 0.72
  order by
    (post.author_device_id = p_device_id) desc,
    extensions.similarity(
      post.normalized_content_loose,
      p_normalized_content
    ) desc,
    post.created_at desc
  limit least(greatest(p_limit, 1), 50)
$$;

create or replace function public.soft_delete_post(
  target_post_id uuid,
  requester_device_id uuid,
  requested_at timestamptz default now()
)
returns public.posts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_row public.posts;
begin
  update public.posts
  set
    status = 'deleted',
    deleted_at = requested_at
  where id = target_post_id
    and author_device_id = requester_device_id
    and status in ('active', 'quarantined')
    and delete_expires_at >= requested_at
  returning * into target_row;

  if target_row.id is null then
    raise exception 'POST_NOT_FOUND_OR_DELETE_WINDOW_EXPIRED';
  end if;

  return target_row;
end;
$$;

alter view public.post_engagement_view set (security_invoker = true);

revoke all on all tables in schema public from public, anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public
  grant execute on functions to service_role;

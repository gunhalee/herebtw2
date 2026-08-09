-- Candidate dashboard performance foundation.
-- Additive and dark by default: existing dashboard reads continue to work until
-- CANDIDATE_INBOX_READ_ENABLED is enabled in the application.

set lock_timeout = '5s';
set statement_timeout = '5min';

create schema if not exists private;

insert into public.settings (key, value)
select
  'candidate_inbox_start_at',
  coalesce(
    (select value || 'T00:00:00+09:00' from public.settings where key = 'election_date'),
    now()::text
  )
on conflict (key) do nothing;

create table public.administrative_areas (
  code text primary key,
  name text not null,
  level text not null check (level in ('province', 'district', 'dong')),
  parent_code text null references public.administrative_areas(code) on delete restrict,
  source text not null default 'kakao_h_code',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint administrative_areas_code_check check (code ~ '^[0-9]{10}$'),
  constraint administrative_areas_parent_check check (parent_code is null or parent_code <> code)
);

create index idx_administrative_areas_parent
  on public.administrative_areas (parent_code, code);

create table public.administrative_area_closure (
  ancestor_code text not null references public.administrative_areas(code) on delete cascade,
  descendant_code text not null references public.administrative_areas(code) on delete cascade,
  depth smallint not null check (depth between 0 and 2),
  primary key (ancestor_code, descendant_code)
);

create index idx_administrative_area_closure_descendant
  on public.administrative_area_closure (descendant_code, ancestor_code);

alter table public.candidates
  add column coverage_version integer not null default 1,
  add column primary_area_code text null,
  add column coverage_updated_at timestamptz not null default now();

alter table public.candidates
  add constraint candidates_coverage_version_check check (coverage_version > 0),
  add constraint candidates_primary_area_code_fkey
    foreign key (primary_area_code)
    references public.administrative_areas(code)
    on delete restrict
    not valid;

create table public.candidate_coverage_areas (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  area_code text not null references public.administrative_areas(code) on delete restrict,
  coverage_version integer not null check (coverage_version > 0),
  coverage_type text not null check (
    coverage_type in ('province', 'district', 'election_district_member', 'manual_override')
  ),
  source text not null,
  active_from timestamptz not null default now(),
  active_until timestamptz null,
  created_at timestamptz not null default now(),
  unique (candidate_id, area_code, coverage_version),
  check (active_until is null or active_until > active_from)
);

create index idx_candidate_coverage_candidate_version
  on public.candidate_coverage_areas (candidate_id, coverage_version, area_code);

create index idx_candidate_coverage_area_version
  on public.candidate_coverage_areas (area_code, coverage_version, candidate_id);

alter table public.posts add column location_area_code text null;

alter table public.posts
  add constraint posts_location_area_code_fkey
    foreign key (location_area_code)
    references public.administrative_areas(code)
    on delete restrict
    not valid;

create index idx_posts_active_location_area_created
  on public.posts (location_area_code, created_at desc, id)
  where status = 'active'
    and moderation_state in ('allowed', 'approved')
    and author_type = 'citizen';

create table public.candidate_routing_queue (
  post_id uuid primary key references public.posts(id) on delete cascade,
  reason text not null check (
    reason in ('published', 'location_changed', 'visibility_changed', 'coverage_changed', 'backfill')
  ),
  requested_version bigint not null default 1 check (requested_version > 0),
  processed_version bigint not null default 0 check (processed_version >= 0),
  available_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  locked_by uuid null,
  locked_at timestamptz null,
  last_error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (processed_version <= requested_version)
);

create index idx_candidate_routing_queue_pending
  on public.candidate_routing_queue (available_at, updated_at, post_id)
  where requested_version > processed_version;

create table public.candidate_post_inbox (
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  coverage_version integer not null check (coverage_version > 0),
  post_id uuid not null references public.posts(id) on delete cascade,
  state text not null check (state in ('open', 'replied_by_me', 'closed_by_other', 'hidden')),
  agree_count_snapshot integer not null default 0 check (agree_count_snapshot >= 0),
  post_created_at timestamptz not null,
  routed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (candidate_id, coverage_version, post_id)
);

create index idx_candidate_inbox_open
  on public.candidate_post_inbox
    (candidate_id, coverage_version, agree_count_snapshot desc, post_created_at desc, post_id)
  where state = 'open';

create index idx_candidate_inbox_mine
  on public.candidate_post_inbox
    (candidate_id, coverage_version, post_created_at desc, post_id)
  where state = 'replied_by_me';

create index idx_candidate_inbox_post
  on public.candidate_post_inbox (post_id, candidate_id, coverage_version);

create table public.candidate_dashboard_counters (
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  coverage_version integer not null check (coverage_version > 0),
  total_targeted bigint not null default 0 check (total_targeted >= 0),
  open_posts bigint not null default 0 check (open_posts >= 0),
  replied_by_me bigint not null default 0 check (replied_by_me >= 0),
  closed_by_other bigint not null default 0 check (closed_by_other >= 0),
  updated_at timestamptz not null default now(),
  primary key (candidate_id, coverage_version)
);

create table public.candidate_priority_queue (
  post_id uuid primary key references public.posts(id) on delete cascade,
  requested_at timestamptz not null default now(),
  processed_at timestamptz null
);

create index idx_candidate_priority_queue_pending
  on public.candidate_priority_queue (requested_at, post_id)
  where processed_at is null;

create table public.candidate_write_requests (
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  client_request_id uuid not null,
  operation text not null check (operation in ('reply')),
  request_hash text not null,
  status text not null default 'processing' check (status in ('processing', 'succeeded')),
  result_entity_id uuid null,
  result_payload jsonb null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  primary key (candidate_id, client_request_id)
);

create index idx_candidate_write_requests_expiry
  on public.candidate_write_requests (expires_at);

create table public.reply_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null unique references public.replies(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'retry', 'sent', 'skipped', 'dead')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_by uuid null,
  locked_at timestamptz null,
  provider_message_id text null,
  last_error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz null,
  expires_at timestamptz not null default (now() + interval '90 days')
);

create index idx_reply_notification_outbox_claim
  on public.reply_notification_outbox (next_attempt_at, created_at, id)
  where status in ('pending', 'retry', 'processing');

-- Ensure every numeric Kakao H-code used by a new post has its province and
-- district ancestors before the post foreign key is checked.
create or replace function private.ensure_post_location_area()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_code text;
  province_code text;
  district_code text;
  selected_code text;
begin
  if new.author_type <> 'citizen' or new.administrative_dong_code !~ '^[0-9]{10}$' then
    new.location_area_code := null;
    return new;
  end if;

  source_code := new.administrative_dong_code;
  province_code := left(source_code, 2) || '00000000';
  district_code := left(source_code, 5) || '00000';

  insert into public.administrative_areas (code, name, level, parent_code)
  values (province_code, province_code, 'province', null)
  on conflict (code) do nothing;

  if district_code <> province_code then
    insert into public.administrative_areas (code, name, level, parent_code)
    values (district_code, district_code, 'district', province_code)
    on conflict (code) do nothing;
  end if;

  if source_code not in (province_code, district_code) then
    insert into public.administrative_areas (code, name, level, parent_code)
    values (source_code, new.administrative_dong_name, 'dong', district_code)
    on conflict (code) do update
      set name = excluded.name,
          is_active = true,
          updated_at = now();
  end if;

  selected_code := case new.location_scope
    when 'province' then province_code
    when 'district' then district_code
    else source_code
  end;
  new.location_area_code := selected_code;

  insert into public.administrative_area_closure (ancestor_code, descendant_code, depth)
  values (province_code, province_code, 0)
  on conflict do nothing;

  if district_code <> province_code then
    insert into public.administrative_area_closure (ancestor_code, descendant_code, depth)
    values
      (district_code, district_code, 0),
      (province_code, district_code, 1)
    on conflict do nothing;
  end if;

  if source_code not in (province_code, district_code) then
    insert into public.administrative_area_closure (ancestor_code, descendant_code, depth)
    values
      (source_code, source_code, 0),
      (district_code, source_code, 1),
      (province_code, source_code, 2)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_posts_ensure_location_area on public.posts;
create trigger trg_posts_ensure_location_area
before insert or update of administrative_dong_code, administrative_dong_name, location_scope, author_type
on public.posts
for each row execute function private.ensure_post_location_area();

-- Backfill canonical area rows through the same guarded trigger logic.
update public.posts
set administrative_dong_code = administrative_dong_code
where author_type = 'citizen'
  and administrative_dong_code ~ '^[0-9]{10}$'
  and location_area_code is null;

create or replace function private.enqueue_candidate_routing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  queue_reason text;
begin
  if new.author_type <> 'citizen' then
    return new;
  end if;

  queue_reason := case
    when tg_op = 'INSERT' then 'published'
    when new.location_area_code is distinct from old.location_area_code then 'location_changed'
    else 'visibility_changed'
  end;

  insert into public.candidate_routing_queue (post_id, reason)
  values (new.id, queue_reason)
  on conflict (post_id) do update
    set reason = excluded.reason,
        requested_version = public.candidate_routing_queue.requested_version + 1,
        available_at = now(),
        locked_by = null,
        locked_at = null,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_posts_enqueue_candidate_routing on public.posts;
create trigger trg_posts_enqueue_candidate_routing
after insert or update of
  status,
  moderation_state,
  administrative_dong_code,
  location_area_code,
  location_scope,
  author_type,
  reply_status
on public.posts
for each row execute function private.enqueue_candidate_routing();

create or replace function private.enqueue_candidate_priority()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.candidate_priority_queue (post_id, requested_at, processed_at)
  values (coalesce(new.post_id, old.post_id), now(), null)
  on conflict (post_id) do update
    set requested_at = now(), processed_at = null;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reactions_enqueue_candidate_priority on public.post_reactions;
create trigger trg_reactions_enqueue_candidate_priority
after insert or delete on public.post_reactions
for each row execute function private.enqueue_candidate_priority();

create or replace function private.refresh_candidate_counters(
  p_candidate_id uuid,
  p_coverage_version integer
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.candidate_dashboard_counters (
    candidate_id, coverage_version, total_targeted, open_posts,
    replied_by_me, closed_by_other, updated_at
  )
  select
    p_candidate_id,
    p_coverage_version,
    count(*) filter (where state <> 'hidden'),
    count(*) filter (where state = 'open'),
    count(*) filter (where state = 'replied_by_me'),
    count(*) filter (where state = 'closed_by_other'),
    now()
  from public.candidate_post_inbox
  where candidate_id = p_candidate_id
    and coverage_version = p_coverage_version
  on conflict (candidate_id, coverage_version) do update set
    total_targeted = excluded.total_targeted,
    open_posts = excluded.open_posts,
    replied_by_me = excluded.replied_by_me,
    closed_by_other = excluded.closed_by_other,
    updated_at = excluded.updated_at
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
      and target_post.location_area_code is not null
      and target_post.created_at >= (
        select value::timestamptz from public.settings where key = 'candidate_inbox_start_at'
      ) then
      for target_candidate in
        select distinct candidate.id, candidate.coverage_version
        from public.candidates as candidate
        join public.candidate_coverage_areas as coverage
          on coverage.candidate_id = candidate.id
         and coverage.coverage_version = candidate.coverage_version
         and coverage.active_from <= now()
         and (coverage.active_until is null or coverage.active_until > now())
        join public.administrative_areas as coverage_area
          on coverage_area.code = coverage.area_code
        where candidate.is_active
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
          )
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

create or replace function private.process_candidate_priority_batch(p_limit integer default 500)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  with claimable as (
    select post_id
    from public.candidate_priority_queue
    where processed_at is null
    order by requested_at, post_id
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 500), 2000))
  ), counts as (
    select claimable.post_id, count(reaction.id)::integer as agree_count
    from claimable
    left join public.post_reactions reaction
      on reaction.post_id = claimable.post_id and reaction.reaction_type = 'agree'
    group by claimable.post_id
  ), refreshed as (
    update public.candidate_post_inbox inbox
    set agree_count_snapshot = counts.agree_count, updated_at = now()
    from counts
    where inbox.post_id = counts.post_id
    returning inbox.post_id
  )
  update public.candidate_priority_queue queue
  set processed_at = now()
  where queue.post_id in (select post_id from claimable);
  get diagnostics changed = row_count;
  return changed;
end;
$$;

create or replace function public.get_candidate_dashboard_bootstrap_v2(
  p_auth_user_id uuid,
  p_filter text default 'open',
  p_limit integer default 20,
  p_cursor_agree_count integer default null,
  p_cursor_created_at timestamptz default null,
  p_cursor_post_id uuid default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with principal as (
    select candidate.*
    from public.candidates candidate
    where candidate.auth_user_id = p_auth_user_id
    limit 1
  ), selected as (
    select
      inbox.post_id,
      inbox.state,
      inbox.agree_count_snapshot,
      inbox.post_created_at,
      post.public_uuid,
      post.content,
      post.administrative_dong_name,
      post.reply_status,
      post.is_pinned,
      post.author_type,
      reply.content as reply_content,
      reply.is_promise as reply_is_promise,
      reply.promise_deadline as reply_promise_deadline,
      reply.created_at as reply_created_at,
      reply_candidate.name as reply_candidate_name
    from principal
    join public.candidate_post_inbox inbox
      on inbox.candidate_id = principal.id
     and inbox.coverage_version = principal.coverage_version
    join public.posts post
      on post.id = inbox.post_id
     and post.status = 'active'
     and post.moderation_state in ('allowed', 'approved')
    left join public.replies reply on reply.post_id = post.id
    left join public.candidates reply_candidate on reply_candidate.id = reply.candidate_id
    where (
      (coalesce(p_filter, 'open') = 'open' and inbox.state = 'open')
      or (p_filter = 'mine' and inbox.state = 'replied_by_me')
    )
      and (
        p_cursor_created_at is null
        or inbox.agree_count_snapshot < p_cursor_agree_count
        or (
          inbox.agree_count_snapshot = p_cursor_agree_count
          and inbox.post_created_at < p_cursor_created_at
        )
        or (
          inbox.agree_count_snapshot = p_cursor_agree_count
          and inbox.post_created_at = p_cursor_created_at
          and inbox.post_id > p_cursor_post_id
        )
      )
    order by inbox.agree_count_snapshot desc, inbox.post_created_at desc, inbox.post_id asc
    limit greatest(1, least(coalesce(p_limit, 20), 50)) + 1
  ), page as (
    select * from selected
    limit greatest(1, least(coalesce(p_limit, 20), 50))
  ), last_item as (
    select * from page
    order by agree_count_snapshot asc, post_created_at asc, post_id desc
    limit 1
  )
  select case
    when not exists (select 1 from principal) then jsonb_build_object('status', 'candidate_not_found')
    else jsonb_build_object(
      'status', case
        when not (select is_active from principal) then 'candidate_inactive'
        when (select first_message_id is null and pending_first_message_id is null from principal)
          then 'onboarding_required'
        else 'ok'
      end,
      'candidate', (
        select jsonb_build_object(
          'id', id, 'name', name, 'district', district, 'isActive', is_active,
          'coverageVersion', coverage_version
        ) from principal
      ),
      'onboarding', (
        select jsonb_build_object(
          'hasFirstMessage', first_message_id is not null,
          'hasPendingFirstMessage', pending_first_message_id is not null
        ) from principal
      ),
      'firstMessage', (
        select case when post.id is null then null else
          jsonb_build_object('id', post.id, 'content', post.content)
        end
        from principal left join public.posts post on post.id = principal.first_message_id
      ),
      'stats', (
        select jsonb_build_object(
          'totalTargeted', coalesce(counter.total_targeted, 0),
          'openPosts', coalesce(counter.open_posts, 0),
          'repliedByMe', coalesce(counter.replied_by_me, 0),
          'closedByOther', coalesce(counter.closed_by_other, 0),
          'replyRate', case when coalesce(counter.total_targeted, 0) = 0 then 0
            else round(counter.replied_by_me::numeric / counter.total_targeted::numeric * 100, 1) end
        )
        from principal left join public.candidate_dashboard_counters counter
          on counter.candidate_id = principal.id
         and counter.coverage_version = principal.coverage_version
      ),
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', post_id,
          'public_uuid', public_uuid,
          'content', content,
          'administrative_dong_name', administrative_dong_name,
          'created_at', post_created_at,
          'reply_status', reply_status,
          'is_pinned', is_pinned,
          'author_type', author_type,
          'agree_count', agree_count_snapshot,
          'has_reply', state <> 'open',
          'reply_candidate_name', reply_candidate_name,
          'reply_content', reply_content,
          'reply_is_promise', reply_is_promise,
          'reply_promise_deadline', reply_promise_deadline,
          'reply_created_at', reply_created_at
        ) order by agree_count_snapshot desc, post_created_at desc, post_id asc)
        from page
      ), '[]'::jsonb),
      'nextCursorParts', case when (select count(*) from selected) > greatest(1, least(coalesce(p_limit, 20), 50))
        then (select jsonb_build_object(
          'agreeCount', agree_count_snapshot,
          'createdAt', post_created_at,
          'postId', post_id
        ) from last_item)
        else null end,
      'generatedAt', now()
    )
  end
$$;

create or replace function public.get_candidate_reply_target_v2(
  p_auth_user_id uuid,
  p_post_id uuid
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with principal as (
    select id, coverage_version
    from public.candidates
    where auth_user_id = p_auth_user_id and is_active
    limit 1
  ), target as (
    select post.*
    from principal
    join public.candidate_post_inbox inbox
      on inbox.candidate_id = principal.id
     and inbox.coverage_version = principal.coverage_version
     and inbox.post_id = p_post_id
     and inbox.state = 'open'
    join public.posts post
      on post.id = inbox.post_id
     and post.status = 'active'
     and post.moderation_state in ('allowed', 'approved')
  )
  select case
    when exists (select 1 from target) then jsonb_build_object(
      'status', 'eligible',
      'post', (select jsonb_build_object(
        'id', id, 'public_uuid', public_uuid, 'content', content,
        'administrative_dong_name', administrative_dong_name, 'created_at', created_at
      ) from target)
    )
    when exists (select 1 from public.replies where post_id = p_post_id) then jsonb_build_object(
      'status', 'already_replied',
      'publicUuid', (select public_uuid from public.posts where id = p_post_id)
    )
    else jsonb_build_object('status', 'not_found')
  end
$$;

create or replace function public.replace_candidate_coverage(
  p_candidate_id uuid,
  p_area_codes text[],
  p_coverage_type text,
  p_source text
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  target_candidate public.candidates;
  next_version integer;
  area_code text;
begin
  if coalesce(array_length(p_area_codes, 1), 0) = 0
    or p_coverage_type not in ('province', 'district', 'election_district_member', 'manual_override')
    or nullif(btrim(p_source), '') is null then
    return jsonb_build_object('status', 'validation_error');
  end if;

  select * into target_candidate
  from public.candidates where id = p_candidate_id for update;
  if target_candidate.id is null then
    return jsonb_build_object('status', 'candidate_not_found');
  end if;

  if exists (
    select 1 from unnest(p_area_codes) code
    where not exists (select 1 from public.administrative_areas area where area.code = code)
  ) then
    return jsonb_build_object('status', 'unknown_area_code');
  end if;

  next_version := target_candidate.coverage_version + 1;
  foreach area_code in array p_area_codes loop
    insert into public.candidate_coverage_areas (
      candidate_id, area_code, coverage_version, coverage_type, source
    ) values (
      p_candidate_id, area_code, next_version, p_coverage_type, btrim(p_source)
    );
  end loop;

  update public.candidates
  set coverage_version = next_version,
      primary_area_code = p_area_codes[1],
      coverage_updated_at = now()
  where id = p_candidate_id;

  insert into public.candidate_dashboard_counters (candidate_id, coverage_version)
  values (p_candidate_id, next_version)
  on conflict do nothing;

  insert into public.candidate_routing_queue (post_id, reason)
  select post.id, 'coverage_changed'
  from public.posts post
  where post.status = 'active'
    and post.moderation_state in ('allowed', 'approved')
    and post.author_type = 'citizen'
    and post.location_area_code is not null
    and post.created_at >= (
      select value::timestamptz from public.settings where key = 'candidate_inbox_start_at'
    )
  on conflict (post_id) do update
    set reason = 'coverage_changed',
        requested_version = public.candidate_routing_queue.requested_version + 1,
        available_at = now(),
        updated_at = now();

  return jsonb_build_object(
    'status', 'ok',
    'candidateId', p_candidate_id,
    'coverageVersion', next_version,
    'areaCount', array_length(p_area_codes, 1)
  );
end;
$$;

create or replace function public.create_candidate_reply_atomic(
  p_auth_user_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_post_id uuid,
  p_content text,
  p_is_promise boolean,
  p_promise_deadline date
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  principal public.candidates;
  existing_request public.candidate_write_requests;
  target_post public.posts;
  created_reply public.replies;
  affected record;
  response_payload jsonb;
begin
  if p_client_request_id is null or p_request_hash is null
    or char_length(btrim(p_content)) not between 1 and 200 then
    return jsonb_build_object('status', 'validation_error');
  end if;

  select * into principal
  from public.candidates
  where auth_user_id = p_auth_user_id
  limit 1;

  if principal.id is null then return jsonb_build_object('status', 'candidate_not_found'); end if;
  if not principal.is_active then return jsonb_build_object('status', 'candidate_inactive'); end if;

  insert into public.candidate_write_requests (
    candidate_id, client_request_id, operation, request_hash
  ) values (
    principal.id, p_client_request_id, 'reply', p_request_hash
  ) on conflict do nothing;

  select * into existing_request
  from public.candidate_write_requests
  where candidate_id = principal.id and client_request_id = p_client_request_id
  for update;

  if existing_request.request_hash <> p_request_hash then
    return jsonb_build_object('status', 'idempotency_conflict');
  end if;
  if existing_request.status = 'succeeded' then
    return existing_request.result_payload;
  end if;

  select * into target_post from public.posts where id = p_post_id for update;
  if target_post.id is null
    or target_post.status <> 'active'
    or target_post.moderation_state not in ('allowed', 'approved') then
    return jsonb_build_object('status', 'post_not_eligible');
  end if;

  if not exists (
    select 1 from public.candidate_post_inbox
    where candidate_id = principal.id
      and coverage_version = principal.coverage_version
      and post_id = p_post_id
      and state = 'open'
  ) then
    if exists (select 1 from public.replies where post_id = p_post_id) then
      return jsonb_build_object('status', 'already_replied', 'publicUuid', target_post.public_uuid);
    end if;
    return jsonb_build_object('status', 'post_not_eligible');
  end if;

  if exists (select 1 from public.replies where post_id = p_post_id) then
    return jsonb_build_object('status', 'already_replied', 'publicUuid', target_post.public_uuid);
  end if;

  insert into public.replies (post_id, candidate_id, content, is_promise, promise_deadline)
  values (
    p_post_id, principal.id, btrim(p_content), coalesce(p_is_promise, false),
    case when coalesce(p_is_promise, false) then p_promise_deadline else null end
  ) returning * into created_reply;

  update public.candidate_post_inbox
  set state = case when candidate_id = principal.id then 'replied_by_me' else 'closed_by_other' end,
      updated_at = now()
  where post_id = p_post_id and state = 'open';

  for affected in
    select distinct candidate_id, coverage_version
    from public.candidate_post_inbox where post_id = p_post_id
  loop
    perform private.refresh_candidate_counters(affected.candidate_id, affected.coverage_version);
  end loop;

  insert into public.reply_notification_outbox (reply_id)
  values (created_reply.id)
  on conflict (reply_id) do nothing;

  response_payload := jsonb_build_object(
    'status', 'ok',
    'reply', jsonb_build_object(
      'id', created_reply.id,
      'postId', created_reply.post_id,
      'candidateId', created_reply.candidate_id,
      'content', created_reply.content,
      'isPromise', created_reply.is_promise,
      'promiseDeadline', created_reply.promise_deadline,
      'publicUuid', target_post.public_uuid,
      'createdAt', created_reply.created_at
    ),
    'notification', 'queued'
  );

  update public.candidate_write_requests
  set status = 'succeeded', result_entity_id = created_reply.id, result_payload = response_payload
  where candidate_id = principal.id and client_request_id = p_client_request_id;

  return response_payload;
end;
$$;

create or replace function public.claim_reply_notifications(
  p_worker_id uuid,
  p_limit integer default 20
)
returns table (
  outbox_id uuid,
  reply_id uuid,
  attempts integer,
  recipient_email text,
  post_content text,
  post_public_uuid uuid,
  candidate_name text
)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  return query
  with claimable as (
    select outbox.id
    from public.reply_notification_outbox outbox
    where (
      outbox.status in ('pending', 'retry') and outbox.next_attempt_at <= now()
    ) or (
      outbox.status = 'processing' and outbox.locked_at < now() - interval '2 minutes'
    )
    order by outbox.next_attempt_at, outbox.created_at, outbox.id
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 50))
  ), leased as (
    update public.reply_notification_outbox outbox
    set status = 'processing', locked_by = p_worker_id, locked_at = now(),
        attempts = outbox.attempts + 1, updated_at = now()
    from claimable
    where outbox.id = claimable.id
    returning outbox.*
  )
  select
    leased.id,
    leased.reply_id,
    leased.attempts,
    case
      when post.notification_email_verified_at is not null then post.notification_email::text
      else null
    end,
    post.content::text,
    post.public_uuid,
    candidate.name::text
  from leased
  join public.replies reply on reply.id = leased.reply_id
  join public.posts post on post.id = reply.post_id
  join public.candidates candidate on candidate.id = reply.candidate_id;
end;
$$;

create or replace function public.complete_reply_notification(
  p_outbox_id uuid,
  p_worker_id uuid,
  p_status text,
  p_provider_message_id text default null,
  p_error_code text default null,
  p_next_attempt_at timestamptz default null
)
returns boolean
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if p_status not in ('sent', 'skipped', 'retry', 'dead') then
    raise exception 'INVALID_NOTIFICATION_STATUS';
  end if;
  update public.reply_notification_outbox
  set status = p_status,
      provider_message_id = p_provider_message_id,
      last_error_code = p_error_code,
      next_attempt_at = coalesce(p_next_attempt_at, next_attempt_at),
      sent_at = case when p_status = 'sent' then now() else sent_at end,
      locked_by = null,
      locked_at = null,
      updated_at = now()
  where id = p_outbox_id and locked_by = p_worker_id and status = 'processing';
  return found;
end;
$$;

create or replace function public.run_candidate_routing_batch(p_limit integer default 200)
returns integer
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.process_candidate_routing_batch(p_limit)
$$;

create or replace function public.run_candidate_priority_batch(p_limit integer default 500)
returns integer
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.process_candidate_priority_batch(p_limit)
$$;

create or replace function public.cleanup_candidate_dashboard_operational_data()
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  write_request_count integer;
  notification_count integer;
  inbox_count integer;
  coverage_count integer;
begin
  delete from public.candidate_write_requests where expires_at < now();
  get diagnostics write_request_count = row_count;
  delete from public.reply_notification_outbox where expires_at < now();
  get diagnostics notification_count = row_count;
  delete from public.candidate_post_inbox inbox
  using public.candidates candidate
  where candidate.id = inbox.candidate_id
    and inbox.coverage_version <> candidate.coverage_version
    and candidate.coverage_updated_at < now() - interval '7 days';
  get diagnostics inbox_count = row_count;
  delete from public.candidate_coverage_areas coverage
  using public.candidates candidate
  where candidate.id = coverage.candidate_id
    and coverage.coverage_version <> candidate.coverage_version
    and candidate.coverage_updated_at < now() - interval '7 days';
  get diagnostics coverage_count = row_count;
  return jsonb_build_object(
    'writeRequests', write_request_count,
    'notifications', notification_count,
    'oldInboxRows', inbox_count,
    'oldCoverageRows', coverage_count
  );
end;
$$;

create or replace function public.get_candidate_dashboard_operational_status()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with active_candidates as (
    select id, coverage_version
    from public.candidates
    where is_active
  ), routing as (
    select
      count(*) filter (where requested_version > processed_version) as pending,
      extract(epoch from now() - min(updated_at) filter (
        where requested_version > processed_version
      ))::integer as oldest_seconds,
      count(*) filter (
        where requested_version = processed_version and last_error_code is not null
      ) as dead
    from public.candidate_routing_queue
  ), priority as (
    select count(*) filter (where processed_at is null) as pending
    from public.candidate_priority_queue
  ), notification as (
    select
      count(*) filter (where status in ('pending', 'processing', 'retry')) as pending,
      count(*) filter (where status = 'dead') as dead
    from public.reply_notification_outbox
  ), actual_counters as (
    select
      candidate_id,
      coverage_version,
      count(*) filter (where state <> 'hidden') as total_targeted,
      count(*) filter (where state = 'open') as open_posts,
      count(*) filter (where state = 'replied_by_me') as replied_by_me,
      count(*) filter (where state = 'closed_by_other') as closed_by_other
    from public.candidate_post_inbox
    group by candidate_id, coverage_version
  ), drift as (
    select count(*) as count
    from public.candidate_dashboard_counters counter
    left join actual_counters actual
      on actual.candidate_id = counter.candidate_id
     and actual.coverage_version = counter.coverage_version
    where row(
      counter.total_targeted,
      counter.open_posts,
      counter.replied_by_me,
      counter.closed_by_other
    ) is distinct from row(
      coalesce(actual.total_targeted, 0),
      coalesce(actual.open_posts, 0),
      coalesce(actual.replied_by_me, 0),
      coalesce(actual.closed_by_other, 0)
    )
  )
  select jsonb_build_object(
    'activeCandidateCount', (select count(*) from active_candidates),
    'maxConcurrentCandidateSessions', (select count(*) * 3 from active_candidates),
    'unmappedCandidateCount', (
      select count(*)
      from active_candidates candidate
      where not exists (
        select 1
        from public.candidate_coverage_areas coverage
        where coverage.candidate_id = candidate.id
          and coverage.coverage_version = candidate.coverage_version
      )
    ),
    'unmappedPostCount', (
      select count(*)
      from public.posts post
      where post.status = 'active'
        and post.moderation_state in ('allowed', 'approved')
        and post.author_type = 'citizen'
        and post.created_at >= (
          select value::timestamptz
          from public.settings
          where key = 'candidate_inbox_start_at'
        )
        and post.location_area_code is null
    ),
    'currentInboxRowCount', (
      select count(*)
      from public.candidate_post_inbox inbox
      join active_candidates candidate
        on candidate.id = inbox.candidate_id
       and candidate.coverage_version = inbox.coverage_version
    ),
    'routingPendingCount', (select pending from routing),
    'routingOldestSeconds', (select oldest_seconds from routing),
    'routingDeadCount', (select dead from routing),
    'priorityPendingCount', (select pending from priority),
    'counterDriftCount', (select count from drift),
    'notificationPendingCount', (select pending from notification),
    'notificationDeadCount', (select dead from notification),
    'checkedAt', now()
  )
$$;

-- Dark backfill: queue existing posts in the current election cycle. Without
-- coverage rows the worker creates no inbox rows; a coverage version update
-- requeues affected posts after operator data is loaded.
insert into public.candidate_routing_queue (post_id, reason)
select post.id, 'backfill'
from public.posts post
where post.status = 'active'
  and post.moderation_state in ('allowed', 'approved')
  and post.author_type = 'citizen'
  and post.location_area_code is not null
  and post.created_at >= (
    select value::timestamptz from public.settings where key = 'candidate_inbox_start_at'
  )
on conflict (post_id) do update
  set reason = 'backfill',
      requested_version = public.candidate_routing_queue.requested_version + 1,
      updated_at = now();

alter table public.administrative_areas enable row level security;
alter table public.administrative_area_closure enable row level security;
alter table public.candidate_coverage_areas enable row level security;
alter table public.candidate_routing_queue enable row level security;
alter table public.candidate_post_inbox enable row level security;
alter table public.candidate_dashboard_counters enable row level security;
alter table public.candidate_priority_queue enable row level security;
alter table public.candidate_write_requests enable row level security;
alter table public.reply_notification_outbox enable row level security;

revoke all on public.administrative_areas from public, anon, authenticated;
revoke all on public.administrative_area_closure from public, anon, authenticated;
revoke all on public.candidate_coverage_areas from public, anon, authenticated;
revoke all on public.candidate_routing_queue from public, anon, authenticated;
revoke all on public.candidate_post_inbox from public, anon, authenticated;
revoke all on public.candidate_dashboard_counters from public, anon, authenticated;
revoke all on public.candidate_priority_queue from public, anon, authenticated;
revoke all on public.candidate_write_requests from public, anon, authenticated;
revoke all on public.reply_notification_outbox from public, anon, authenticated;

grant all on public.administrative_areas to service_role;
grant all on public.administrative_area_closure to service_role;
grant all on public.candidate_coverage_areas to service_role;
grant all on public.candidate_routing_queue to service_role;
grant all on public.candidate_post_inbox to service_role;
grant all on public.candidate_dashboard_counters to service_role;
grant all on public.candidate_priority_queue to service_role;
grant all on public.candidate_write_requests to service_role;
grant all on public.reply_notification_outbox to service_role;

revoke all on function public.get_candidate_dashboard_bootstrap_v2(uuid, text, integer, integer, timestamptz, uuid)
  from public, anon, authenticated;
revoke all on function public.get_candidate_reply_target_v2(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.replace_candidate_coverage(uuid, text[], text, text)
  from public, anon, authenticated;
revoke all on function public.create_candidate_reply_atomic(uuid, uuid, text, uuid, text, boolean, date)
  from public, anon, authenticated;
revoke all on function public.claim_reply_notifications(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.complete_reply_notification(uuid, uuid, text, text, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.run_candidate_routing_batch(integer)
  from public, anon, authenticated;
revoke all on function public.run_candidate_priority_batch(integer)
  from public, anon, authenticated;
revoke all on function public.cleanup_candidate_dashboard_operational_data()
  from public, anon, authenticated;
revoke all on function public.get_candidate_dashboard_operational_status()
  from public, anon, authenticated;

grant execute on function public.get_candidate_dashboard_bootstrap_v2(uuid, text, integer, integer, timestamptz, uuid)
  to service_role;
grant execute on function public.get_candidate_reply_target_v2(uuid, uuid)
  to service_role;
grant execute on function public.replace_candidate_coverage(uuid, text[], text, text)
  to service_role;
grant execute on function public.create_candidate_reply_atomic(uuid, uuid, text, uuid, text, boolean, date)
  to service_role;
grant execute on function public.claim_reply_notifications(uuid, integer)
  to service_role;
grant execute on function public.complete_reply_notification(uuid, uuid, text, text, text, timestamptz)
  to service_role;
grant execute on function public.run_candidate_routing_batch(integer)
  to service_role;
grant execute on function public.run_candidate_priority_batch(integer)
  to service_role;
grant execute on function public.cleanup_candidate_dashboard_operational_data()
  to service_role;
grant execute on function public.get_candidate_dashboard_operational_status()
  to service_role;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;

comment on table public.candidate_post_inbox is
  'Candidate-specific projection. Reads are bounded by candidate, coverage version, and keyset page size.';
comment on table public.reply_notification_outbox is
  'Transactional outbox for asynchronous candidate reply email notifications.';

-- Pure database work stays inside Postgres. Notification delivery is scheduled
-- separately after the worker URL and Vault secret have been configured.
do $$
declare
  existing_job bigint;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    for existing_job in
      select jobid from cron.job
      where jobname in (
        'candidate-routing-worker',
        'candidate-priority-worker',
        'candidate-dashboard-cleanup'
      )
    loop
      perform cron.unschedule(existing_job);
    end loop;

    perform cron.schedule(
      'candidate-routing-worker',
      '1 second',
      $job$ select private.process_candidate_routing_batch(200); $job$
    );
    perform cron.schedule(
      'candidate-priority-worker',
      '10 seconds',
      $job$ select private.process_candidate_priority_batch(500); $job$
    );
    perform cron.schedule(
      'candidate-dashboard-cleanup',
      '17 3 * * *',
      $job$ select public.cleanup_candidate_dashboard_operational_data(); $job$
    );
  end if;
end;
$$;

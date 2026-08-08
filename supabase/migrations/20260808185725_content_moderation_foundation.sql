set lock_timeout = '5s';
set statement_timeout = '120s';

create extension if not exists pgmq cascade;

do $$
begin
  if not exists (
    select 1 from pgmq.list_queues() where queue_name = 'content_moderation'
  ) then
    execute 'select pgmq.create($1)' using 'content_moderation';
  end if;
end;
$$;

revoke all on pgmq.q_content_moderation from public, anon, authenticated;
revoke all on pgmq.a_content_moderation from public, anon, authenticated;
revoke usage on schema pgmq from public, anon, authenticated;
grant usage on schema pgmq to service_role;
grant select, insert, update, delete on pgmq.q_content_moderation to service_role;
grant select, insert, update, delete on pgmq.a_content_moderation to service_role;
grant usage, select on all sequences in schema pgmq to service_role;
grant execute on all functions in schema pgmq to service_role;

alter table public.posts
  add column if not exists moderation_state text not null default 'allowed',
  add column if not exists moderation_policy_version text not null default 'pre-moderation-v1',
  add column if not exists moderation_risk_band text not null default 'low',
  add column if not exists moderation_reason_codes text[] not null default '{}',
  add column if not exists moderation_decided_at timestamptz not null default now(),
  add column if not exists normalization_version smallint not null default 1,
  add column if not exists moderation_content_hmac text;

alter table public.posts
  drop constraint if exists posts_moderation_state_check,
  drop constraint if exists posts_moderation_risk_band_check,
  add constraint posts_moderation_state_check
    check (moderation_state in ('allowed', 'pending_review', 'approved', 'rejected')),
  add constraint posts_moderation_risk_band_check
    check (moderation_risk_band in ('low', 'medium', 'high', 'critical'));

alter table public.posts alter column moderation_decided_at drop not null;

alter table public.candidates
  add column if not exists pending_first_message_id uuid references public.posts(id);

create table public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  source text not null,
  operation text not null default 'create',
  state text not null default 'open',
  priority text not null default 'normal',
  risk_band text not null,
  reason_codes text[] not null default '{}',
  policy_version text not null,
  normalization_version smallint not null,
  content_decision_key text not null,
  provider_status text not null default 'not_requested',
  provider_categories jsonb not null default '{}'::jsonb,
  provider_version text,
  operator_id text,
  opened_at timestamptz not null default now(),
  decided_at timestamptz,
  expires_at timestamptz not null default (now() + interval '90 days'),
  constraint moderation_cases_source_check
    check (source in ('citizen_post', 'candidate_first_message', 'report')),
  constraint moderation_cases_operation_check
    check (operation in ('create', 'update', 'report')),
  constraint moderation_cases_state_check
    check (state in ('open', 'published', 'rejected')),
  constraint moderation_cases_priority_check
    check (priority in ('normal', 'high', 'urgent')),
  constraint moderation_cases_risk_band_check
    check (risk_band in ('medium', 'high', 'critical')),
  constraint moderation_cases_provider_status_check
    check (provider_status in ('not_requested', 'queued', 'completed', 'failed', 'skipped_budget', 'skipped_sampling')),
  constraint moderation_cases_decision_key_check check (char_length(content_decision_key) = 64)
);

create table public.moderation_evidence (
  case_id uuid primary key references public.moderation_cases(id) on delete cascade,
  ciphertext_base64 text not null,
  nonce_base64 text not null,
  auth_tag_base64 text not null,
  key_version text not null,
  aad_version smallint not null default 1,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  constraint moderation_evidence_ciphertext_check check (char_length(ciphertext_base64) between 4 and 4096),
  constraint moderation_evidence_nonce_check check (char_length(nonce_base64) between 16 and 32),
  constraint moderation_evidence_auth_tag_check check (char_length(auth_tag_base64) between 20 and 32)
);

create table public.moderation_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.moderation_cases(id) on delete cascade,
  action text not null,
  operator_id text not null,
  reason_code text not null,
  note text,
  policy_version text not null,
  created_at timestamptz not null default now(),
  constraint moderation_decisions_action_check check (action in ('publish', 'reject', 'restore')),
  constraint moderation_decisions_note_check check (note is null or char_length(note) <= 1000)
);

create table public.moderation_decision_cache (
  content_decision_key text primary key,
  policy_version text not null,
  provider_version text not null,
  categories jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint moderation_decision_cache_key_check check (char_length(content_decision_key) = 64)
);

create table public.moderation_provider_usage (
  billing_period date primary key,
  request_count bigint not null default 0,
  billable_units bigint not null default 0,
  estimated_cost_usd numeric(12,4) not null default 0,
  warning_sent_at timestamptz,
  hard_stop_sent_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint moderation_provider_usage_nonnegative_check
    check (request_count >= 0 and billable_units >= 0 and estimated_cost_usd >= 0)
);

create table public.moderation_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  constraint moderation_notification_attempts_check check (attempts between 0 and 20)
);

create table public.moderation_access_audit (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.moderation_cases(id) on delete set null,
  operator_id text not null,
  action text not null,
  request_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

create index idx_moderation_cases_open_queue
  on public.moderation_cases (priority desc, opened_at asc)
  where state = 'open';
create unique index uq_moderation_cases_open_post
  on public.moderation_cases (post_id) where state = 'open';
create index idx_moderation_cases_expires_at on public.moderation_cases (expires_at);
create index idx_moderation_evidence_expires_at on public.moderation_evidence (expires_at);
create index idx_moderation_outbox_available on public.moderation_notification_outbox (available_at)
  where sent_at is null;
create index idx_moderation_access_audit_expires_at on public.moderation_access_audit (expires_at);
create unique index uq_posts_device_moderation_content_hmac
  on public.posts (author_device_id, moderation_content_hmac)
  where author_device_id is not null
    and moderation_content_hmac is not null
    and status in ('active', 'quarantined');

alter table public.moderation_cases enable row level security;
alter table public.moderation_evidence enable row level security;
alter table public.moderation_decisions enable row level security;
alter table public.moderation_decision_cache enable row level security;
alter table public.moderation_provider_usage enable row level security;
alter table public.moderation_notification_outbox enable row level security;
alter table public.moderation_access_audit enable row level security;

create or replace function public.create_quarantined_post(
  p_case_public_id uuid,
  p_author_device_id uuid,
  p_client_request_id uuid,
  p_candidate_id uuid,
  p_author_type text,
  p_placeholder_content text,
  p_administrative_dong_name text,
  p_administrative_dong_code text,
  p_latitude double precision,
  p_longitude double precision,
  p_latitude_bucket_100m double precision,
  p_longitude_bucket_100m double precision,
  p_location_scope text,
  p_location_source text,
  p_notification_email text,
  p_notification_email_verification_hash text,
  p_notification_email_verification_expires_at timestamptz,
  p_content_hmac text,
  p_source text,
  p_priority text,
  p_risk_band text,
  p_reason_codes text[],
  p_policy_version text,
  p_normalization_version smallint,
  p_ciphertext_base64 text,
  p_evidence_created_at timestamptz,
  p_nonce_base64 text,
  p_auth_tag_base64 text,
  p_key_version text,
  p_aad_version smallint
)
returns table (
  post_id uuid,
  post_public_uuid uuid,
  post_created_at timestamptz,
  post_delete_expires_at timestamptz,
  case_public_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_post public.posts;
  created_case public.moderation_cases;
begin
  if p_author_type not in ('citizen', 'candidate')
    or p_source not in ('citizen_post', 'candidate_first_message')
    or p_risk_band not in ('medium', 'high', 'critical') then
    raise exception 'INVALID_MODERATION_INPUT';
  end if;

  insert into public.posts (
    author_device_id, client_request_id, candidate_id, author_type, content,
    administrative_dong_name, administrative_dong_code, latitude, longitude,
    latitude_bucket_100m, longitude_bucket_100m, location_scope, location_source,
    notification_email, notification_email_verification_hash,
    notification_email_verification_expires_at, is_pinned, delete_expires_at,
    status, moderation_state, moderation_policy_version, moderation_risk_band,
    moderation_reason_codes, moderation_decided_at, normalization_version,
    moderation_content_hmac
  ) values (
    p_author_device_id, p_client_request_id, p_candidate_id, p_author_type,
    p_placeholder_content, p_administrative_dong_name, p_administrative_dong_code,
    p_latitude, p_longitude, p_latitude_bucket_100m, p_longitude_bucket_100m,
    p_location_scope, p_location_source, p_notification_email,
    p_notification_email_verification_hash, p_notification_email_verification_expires_at,
    p_author_type = 'candidate',
    case when p_author_type = 'candidate' then null else now() + interval '3 minutes' end,
    'quarantined', 'pending_review', p_policy_version, p_risk_band,
    coalesce(p_reason_codes, '{}'), null, p_normalization_version, p_content_hmac
  ) returning * into created_post;

  insert into public.moderation_cases (
    public_id, post_id, source, state, priority, risk_band, reason_codes,
    policy_version, normalization_version, content_decision_key, provider_status
  ) values (
    p_case_public_id, created_post.id, p_source, 'open', p_priority, p_risk_band,
    coalesce(p_reason_codes, '{}'), p_policy_version, p_normalization_version, p_content_hmac, 'queued'
  ) returning * into created_case;

  insert into public.moderation_evidence (
    case_id, ciphertext_base64, nonce_base64, auth_tag_base64, created_at,
    key_version, aad_version, expires_at
  ) values (
    created_case.id, p_ciphertext_base64, p_nonce_base64, p_auth_tag_base64, p_evidence_created_at,
    p_key_version, p_aad_version, created_case.expires_at
  );

  if p_author_type = 'candidate' then
    update public.candidates
    set pending_first_message_id = created_post.id
    where id = p_candidate_id
      and first_message_id is null
      and pending_first_message_id is null;

    if not found then
      raise exception 'CANDIDATE_FIRST_MESSAGE_EXISTS';
    end if;
  end if;

  perform pgmq.send(
    'content_moderation',
    jsonb_build_object('casePublicId', created_case.public_id),
    0
  );

  insert into public.moderation_notification_outbox (event_key, event_type, payload)
  values (
    'case-opened:' || created_case.public_id::text,
    'case_opened',
    jsonb_build_object(
      'casePublicId', created_case.public_id,
      'priority', created_case.priority,
      'riskBand', created_case.risk_band,
      'reasonCodes', created_case.reason_codes,
      'openedAt', created_case.opened_at
    )
  ) on conflict (event_key) do nothing;

  return query select
    created_post.id,
    created_post.public_uuid,
    created_post.created_at,
    created_post.delete_expires_at,
    created_case.public_id;
end;
$$;

create or replace function public.claim_content_moderation_jobs(
  p_visibility_timeout integer default 60,
  p_limit integer default 10
)
returns table (msg_id bigint, read_count integer, enqueued_at timestamptz, vt timestamptz, message jsonb)
language sql
volatile
security invoker
set search_path = ''
as $$
  select q.msg_id, q.read_ct, q.enqueued_at, q.vt, q.message
  from pgmq.read('content_moderation', greatest(10, least(p_visibility_timeout, 300)), greatest(1, least(p_limit, 20))) q
$$;

create or replace function public.create_moderation_update_case(
  p_case_public_id uuid,
  p_post_id uuid,
  p_content_hmac text,
  p_priority text,
  p_risk_band text,
  p_reason_codes text[],
  p_policy_version text,
  p_normalization_version smallint,
  p_ciphertext_base64 text,
  p_evidence_created_at timestamptz,
  p_nonce_base64 text,
  p_auth_tag_base64 text,
  p_key_version text,
  p_aad_version smallint
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_case public.moderation_cases;
begin
  if not exists (
    select 1 from public.posts
    where id = p_post_id and author_type = 'candidate' and status = 'active'
  ) then
    raise exception 'CANDIDATE_FIRST_MESSAGE_NOT_FOUND';
  end if;

  if exists (
    select 1 from public.moderation_cases where post_id = p_post_id and state = 'open'
  ) then
    return (
      select public_id from public.moderation_cases
      where post_id = p_post_id and state = 'open' limit 1
    );
  end if;

  insert into public.moderation_cases (
    public_id, post_id, source, operation, state, priority, risk_band,
    reason_codes, policy_version, normalization_version, content_decision_key, provider_status
  ) values (
    p_case_public_id, p_post_id, 'candidate_first_message', 'update', 'open',
    p_priority, p_risk_band, coalesce(p_reason_codes, '{}'), p_policy_version,
    p_normalization_version, p_content_hmac, 'queued'
  ) returning * into created_case;

  insert into public.moderation_evidence (
    case_id, ciphertext_base64, nonce_base64, auth_tag_base64, created_at,
    key_version, aad_version, expires_at
  ) values (
    created_case.id, p_ciphertext_base64, p_nonce_base64, p_auth_tag_base64, p_evidence_created_at,
    p_key_version, p_aad_version, created_case.expires_at
  );

  update public.posts set
    moderation_state = 'pending_review',
    moderation_policy_version = p_policy_version,
    moderation_risk_band = p_risk_band,
    moderation_reason_codes = coalesce(p_reason_codes, '{}'),
    moderation_decided_at = null
  where id = p_post_id;

  perform pgmq.send('content_moderation', jsonb_build_object('casePublicId', created_case.public_id), 0);
  insert into public.moderation_notification_outbox (event_key, event_type, payload)
  values (
    'case-opened:' || created_case.public_id::text,
    'case_opened',
    jsonb_build_object('casePublicId', created_case.public_id, 'priority', created_case.priority,
      'riskBand', created_case.risk_band, 'reasonCodes', created_case.reason_codes,
      'operation', 'update', 'openedAt', created_case.opened_at)
  ) on conflict (event_key) do nothing;

  return created_case.public_id;
end;
$$;

create or replace function public.create_report_moderation_case(
  p_case_public_id uuid,
  p_post_id uuid,
  p_report_reason_code text,
  p_content_hmac text,
  p_policy_version text,
  p_normalization_version smallint,
  p_ciphertext_base64 text,
  p_evidence_created_at timestamptz,
  p_nonce_base64 text,
  p_auth_tag_base64 text,
  p_key_version text,
  p_aad_version smallint
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_case public.moderation_cases;
begin
  if not exists (select 1 from public.posts where id = p_post_id and status = 'active') then
    return null;
  end if;
  if exists (select 1 from public.moderation_cases where post_id = p_post_id and state = 'open') then
    return (select public_id from public.moderation_cases where post_id = p_post_id and state = 'open' limit 1);
  end if;

  insert into public.moderation_cases (
    public_id, post_id, source, operation, state, priority, risk_band,
    reason_codes, policy_version, normalization_version, content_decision_key, provider_status
  ) values (
    p_case_public_id, p_post_id, 'report', 'report', 'open', 'normal', 'medium',
    array['user_report:' || p_report_reason_code], p_policy_version,
    p_normalization_version, p_content_hmac, 'queued'
  ) returning * into created_case;

  insert into public.moderation_evidence (
    case_id, ciphertext_base64, nonce_base64, auth_tag_base64, created_at,
    key_version, aad_version, expires_at
  ) values (
    created_case.id, p_ciphertext_base64, p_nonce_base64, p_auth_tag_base64, p_evidence_created_at,
    p_key_version, p_aad_version, created_case.expires_at
  );

  perform pgmq.send('content_moderation', jsonb_build_object('casePublicId', created_case.public_id), 0);
  insert into public.moderation_notification_outbox (event_key, event_type, payload)
  values ('case-opened:' || created_case.public_id::text, 'case_opened',
    jsonb_build_object('casePublicId', created_case.public_id, 'priority', 'normal',
      'riskBand', 'medium', 'reasonCodes', created_case.reason_codes,
      'operation', 'report', 'openedAt', created_case.opened_at))
  on conflict (event_key) do nothing;
  return created_case.public_id;
end;
$$;

create or replace function public.complete_content_moderation_job(p_msg_id bigint)
returns boolean
language sql
volatile
security invoker
set search_path = ''
as $$
  select pgmq.delete('content_moderation', p_msg_id)
$$;

create or replace function public.record_moderation_provider_result(
  p_case_public_id uuid,
  p_status text,
  p_categories jsonb,
  p_provider_version text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.moderation_cases
  set provider_status = p_status,
      provider_categories = coalesce(p_categories, '{}'::jsonb),
      provider_version = p_provider_version
  where public_id = p_case_public_id and state = 'open';
end;
$$;

create or replace function public.claim_moderation_notifications(p_limit integer default 10)
returns setof public.moderation_notification_outbox
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  with claimable as (
    select id from public.moderation_notification_outbox
    where sent_at is null
      and available_at <= now()
      and (locked_until is null or locked_until < now())
    order by created_at asc
    for update skip locked
    limit greatest(1, least(p_limit, 20))
  )
  update public.moderation_notification_outbox as outbox
  set locked_until = now() + interval '60 seconds'
  from claimable
  where outbox.id = claimable.id
  returning outbox.*;
end;
$$;

create or replace function public.reserve_moderation_provider_units(
  p_units integer,
  p_warning_usd numeric default 50,
  p_hard_stop_usd numeric default 100
)
returns table (allowed boolean, estimated_cost_usd numeric, warning_due boolean, hard_stop_due boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  period_start date := date_trunc('month', now() at time zone 'UTC')::date;
  current_row public.moderation_provider_usage;
  next_units bigint;
  next_cost numeric(12,4);
  should_warn boolean;
  should_stop boolean;
begin
  if p_units not between 1 and 100 then raise exception 'INVALID_PROVIDER_UNITS'; end if;

  insert into public.moderation_provider_usage (billing_period)
  values (period_start) on conflict (billing_period) do nothing;
  select * into current_row from public.moderation_provider_usage
  where billing_period = period_start for update;

  next_units := current_row.billable_units + p_units;
  next_cost := greatest(next_units - 50000, 0) * 0.0005;
  should_warn := next_cost >= p_warning_usd and current_row.warning_sent_at is null;
  should_stop := next_cost > p_hard_stop_usd;

  if should_stop then
    if current_row.hard_stop_sent_at is null then
      update public.moderation_provider_usage set hard_stop_sent_at = now(), updated_at = now()
      where billing_period = period_start;
      insert into public.moderation_notification_outbox (event_key, event_type, payload)
      values ('google-hard-stop:' || period_start::text, 'google_budget_hard_stop',
        jsonb_build_object('billingPeriod', period_start, 'estimatedCostUsd', next_cost))
      on conflict (event_key) do nothing;
    end if;
    return query select false, current_row.estimated_cost_usd, false, true;
    return;
  end if;

  update public.moderation_provider_usage set
    request_count = request_count + 1,
    billable_units = next_units,
    estimated_cost_usd = next_cost,
    warning_sent_at = case when should_warn then now() else warning_sent_at end,
    updated_at = now()
  where billing_period = period_start;

  if should_warn then
    insert into public.moderation_notification_outbox (event_key, event_type, payload)
    values ('google-warning:' || period_start::text, 'google_budget_warning',
      jsonb_build_object('billingPeriod', period_start, 'estimatedCostUsd', next_cost))
    on conflict (event_key) do nothing;
  end if;

  return query select true, next_cost, should_warn, false;
end;
$$;

create or replace function public.apply_moderation_decision(
  p_case_public_id uuid,
  p_action text,
  p_operator_id text,
  p_reason_code text,
  p_note text,
  p_plaintext_content text,
  p_normalized_content_strict text,
  p_normalized_content_loose text,
  p_content_fingerprint text,
  p_content_hmac text,
  p_normalization_version smallint,
  p_policy_version text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_case public.moderation_cases;
  target_post public.posts;
begin
  if p_action not in ('publish', 'reject', 'restore') then
    raise exception 'INVALID_MODERATION_ACTION';
  end if;

  select * into target_case
  from public.moderation_cases
  where public_id = p_case_public_id
  for update;

  if target_case.id is null then
    raise exception 'MODERATION_CASE_NOT_FOUND';
  end if;

  if (p_action in ('publish', 'reject') and target_case.state <> 'open')
    or (p_action = 'restore' and target_case.state <> 'rejected') then
    raise exception 'MODERATION_CASE_ALREADY_DECIDED';
  end if;

  select * into target_post from public.posts where id = target_case.post_id for update;

  if p_action in ('publish', 'restore') then
    if p_plaintext_content is null or char_length(btrim(p_plaintext_content)) not between 1 and 100 then
      raise exception 'MISSING_MODERATION_PLAINTEXT';
    end if;

    update public.posts set
      content = btrim(p_plaintext_content),
      status = 'active',
      moderation_state = 'approved',
      moderation_policy_version = p_policy_version,
      moderation_decided_at = now(),
      normalization_version = p_normalization_version,
      normalized_content_strict = p_normalized_content_strict,
      normalized_content_loose = p_normalized_content_loose,
      content_fingerprint = p_content_fingerprint,
      fingerprint_version = p_normalization_version,
      moderation_content_hmac = p_content_hmac
    where id = target_post.id;

    if target_post.candidate_id is not null then
      update public.candidates set
        first_message_id = target_post.id,
        pending_first_message_id = null
      where id = target_post.candidate_id;
    end if;
  elsif target_case.operation = 'update' then
    update public.posts set
      moderation_state = 'allowed',
      moderation_policy_version = p_policy_version,
      moderation_decided_at = now()
    where id = target_post.id;
  else
    update public.posts set
      status = 'hidden',
      moderation_state = 'rejected',
      moderation_policy_version = p_policy_version,
      moderation_decided_at = now()
    where id = target_post.id;

    if target_post.candidate_id is not null then
      update public.candidates set pending_first_message_id = null
      where id = target_post.candidate_id and pending_first_message_id = target_post.id;
    end if;
  end if;

  update public.moderation_cases set
    state = case when p_action in ('publish', 'restore') then 'published' else 'rejected' end,
    operator_id = p_operator_id,
    decided_at = now()
  where id = target_case.id;

  insert into public.moderation_decisions (
    case_id, action, operator_id, reason_code, note, policy_version
  ) values (
    target_case.id, p_action, p_operator_id, p_reason_code, nullif(btrim(p_note), ''), p_policy_version
  );

  insert into public.moderation_notification_outbox (event_key, event_type, payload)
  values (
    'case-decided:' || target_case.public_id::text || ':' || p_action,
    'case_decided',
    jsonb_build_object('casePublicId', target_case.public_id, 'action', p_action, 'operatorId', p_operator_id)
  ) on conflict (event_key) do nothing;
end;
$$;

create or replace function public.cleanup_expired_moderation_data()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  evidence_count integer;
  cache_count integer;
  outbox_count integer;
  audit_count integer;
begin
  delete from public.moderation_evidence where expires_at < now();
  get diagnostics evidence_count = row_count;
  delete from public.moderation_decision_cache where expires_at < now();
  get diagnostics cache_count = row_count;
  delete from public.moderation_notification_outbox where expires_at < now();
  get diagnostics outbox_count = row_count;
  delete from public.moderation_access_audit where expires_at < now();
  get diagnostics audit_count = row_count;
  delete from public.abuse_logs where expires_at < now();
  delete from public.abuse_rate_windows where expires_at < now();
  return jsonb_build_object(
    'evidence', evidence_count, 'cache', cache_count,
    'outbox', outbox_count, 'audit', audit_count
  );
end;
$$;

revoke all on public.moderation_cases from public, anon, authenticated;
revoke all on public.moderation_evidence from public, anon, authenticated;
revoke all on public.moderation_decisions from public, anon, authenticated;
revoke all on public.moderation_decision_cache from public, anon, authenticated;
revoke all on public.moderation_provider_usage from public, anon, authenticated;
revoke all on public.moderation_notification_outbox from public, anon, authenticated;
revoke all on public.moderation_access_audit from public, anon, authenticated;
grant all on public.moderation_cases to service_role;
grant all on public.moderation_evidence to service_role;
grant all on public.moderation_decisions to service_role;
grant all on public.moderation_decision_cache to service_role;
grant all on public.moderation_provider_usage to service_role;
grant all on public.moderation_notification_outbox to service_role;
grant all on public.moderation_access_audit to service_role;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

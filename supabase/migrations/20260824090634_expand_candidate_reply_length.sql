-- Candidate replies may contain up to 2,000 trimmed characters.
-- Keep the source table, feed projection, and atomic write path aligned.

alter table public.replies
  drop constraint if exists replies_content_length_check;

alter table public.replies
  alter column content type varchar(2000);

alter table public.replies
  add constraint replies_content_length_check
  check (char_length(content) between 1 and 2000);

alter table public.post_feed_projection
  alter column latest_reply_content type varchar(2000);

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
    or char_length(btrim(p_content)) not between 1 and 2000 then
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

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

revoke execute on function public.consume_abuse_budget(
  text,
  text,
  text,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function public.consume_abuse_budget(
  text,
  text,
  text,
  integer,
  integer
) to service_role;

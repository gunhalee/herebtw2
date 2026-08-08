alter table public.posts
  add column if not exists notification_email_verified_at timestamptz,
  add column if not exists notification_email_verification_hash text,
  add column if not exists notification_email_verification_expires_at timestamptz;

create unique index if not exists uq_posts_notification_verification_hash
  on public.posts (notification_email_verification_hash)
  where notification_email_verification_hash is not null;

create or replace function public.verify_post_notification_email(
  p_public_uuid uuid,
  p_token_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_count integer;
begin
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    return false;
  end if;

  update public.posts
  set
    notification_email_verified_at = now(),
    notification_email_verification_hash = null,
    notification_email_verification_expires_at = null
  where public_uuid = p_public_uuid
    and notification_email is not null
    and notification_email_verification_hash = p_token_hash
    and notification_email_verification_expires_at >= now()
    and status in ('active', 'quarantined');

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke execute on function public.verify_post_notification_email(uuid, text)
  from public, anon, authenticated;
grant execute on function public.verify_post_notification_email(uuid, text)
  to service_role;

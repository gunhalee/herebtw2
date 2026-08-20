-- A post's pin color is decorative only. Store a semantic token rather than a
-- presentation hex value so each client can keep using its own shared palette.
set lock_timeout = '5s';

alter table public.posts
  add column pin_color text not null default 'yellow',
  add constraint posts_pin_color_check
  check (pin_color in ('yellow', 'red', 'green', 'purple'));

comment on column public.posts.pin_color is
  'Decorative pin palette token: yellow, red, green, or purple.';

-- Keep the original moderation RPC intact for herebtw2 callers. switchmove
-- supplies the extra named argument and PostgREST selects this overload. The
-- original creation and this update run in the same transaction.
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
  p_aad_version smallint,
  p_pin_color text
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
  created_post record;
begin
  if p_pin_color is null
    or p_pin_color not in ('yellow', 'red', 'green', 'purple') then
    raise exception 'INVALID_PIN_COLOR' using errcode = '22023';
  end if;

  select *
  into created_post
  from public.create_quarantined_post(
    p_case_public_id => p_case_public_id,
    p_author_device_id => p_author_device_id,
    p_client_request_id => p_client_request_id,
    p_candidate_id => p_candidate_id,
    p_author_type => p_author_type,
    p_placeholder_content => p_placeholder_content,
    p_administrative_dong_name => p_administrative_dong_name,
    p_administrative_dong_code => p_administrative_dong_code,
    p_latitude => p_latitude,
    p_longitude => p_longitude,
    p_latitude_bucket_100m => p_latitude_bucket_100m,
    p_longitude_bucket_100m => p_longitude_bucket_100m,
    p_location_scope => p_location_scope,
    p_location_source => p_location_source,
    p_notification_email => p_notification_email,
    p_notification_email_verification_hash =>
      p_notification_email_verification_hash,
    p_notification_email_verification_expires_at =>
      p_notification_email_verification_expires_at,
    p_content_hmac => p_content_hmac,
    p_source => p_source,
    p_priority => p_priority,
    p_risk_band => p_risk_band,
    p_reason_codes => p_reason_codes,
    p_policy_version => p_policy_version,
    p_normalization_version => p_normalization_version,
    p_ciphertext_base64 => p_ciphertext_base64,
    p_evidence_created_at => p_evidence_created_at,
    p_nonce_base64 => p_nonce_base64,
    p_auth_tag_base64 => p_auth_tag_base64,
    p_key_version => p_key_version,
    p_aad_version => p_aad_version
  );

  update public.posts
  set pin_color = p_pin_color
  where id = created_post.post_id;

  return query
  select
    created_post.post_id,
    created_post.post_public_uuid,
    created_post.post_created_at,
    created_post.post_delete_expires_at,
    created_post.case_public_id;
end;
$$;

notify pgrst, 'reload schema';

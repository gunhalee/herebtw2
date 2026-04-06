create or replace function public.toggle_post_agree(
  target_post_id uuid,
  viewer_anonymous_device_id text
)
returns table (
  post_id uuid,
  agreed boolean,
  agree_count integer
)
language plpgsql
security definer
as $$
declare
  viewer_device_id uuid;
  deleted_reaction_count integer;
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
    from public.posts
    where id = target_post_id
      and status = 'active'
  ) then
    return query
      select target_post_id, false, 0;
    return;
  end if;

  with deleted_reactions as (
    delete from public.post_reactions
    where post_id = target_post_id
      and device_id = viewer_device_id
      and reaction_type = 'agree'
    returning id
  )
  select count(*)::int
  into deleted_reaction_count
  from deleted_reactions;

  if deleted_reaction_count > 0 then
    return query
      select
        target_post_id,
        false,
        count(*)::int
      from public.post_reactions
      where post_id = target_post_id
        and reaction_type = 'agree';
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

  return query
    select
      target_post_id,
      true,
      count(*)::int
    from public.post_reactions
    where post_id = target_post_id
      and reaction_type = 'agree';
end;
$$;

create or replace function public.touch_device_identity()
returns trigger
language plpgsql
as $$
begin
  new.last_seen_at = now();
  return new;
end;
$$;

create trigger trg_device_identities_touch
before update on public.device_identities
for each row
execute function public.touch_device_identity();

create or replace function public.soft_delete_post(
  target_post_id uuid,
  requester_device_id uuid,
  requested_at timestamptz default now()
)
returns public.posts
language plpgsql
security definer
as $$
declare
  target_row public.posts;
begin
  update public.posts
     set status = 'deleted',
         deleted_at = requested_at
   where id = target_post_id
     and author_device_id = requester_device_id
     and status = 'active'
     and delete_expires_at >= requested_at
  returning * into target_row;

  if target_row.id is null then
    raise exception 'POST_NOT_FOUND_OR_DELETE_WINDOW_EXPIRED';
  end if;

  return target_row;
end;
$$;

create or replace view public.post_engagement_view as
select
  p.id as post_id,
  count(pr.id)::int as agree_count
from public.posts p
left join public.post_reactions pr
  on pr.post_id = p.id
 and pr.reaction_type = 'agree'
where p.status = 'active'
group by p.id;

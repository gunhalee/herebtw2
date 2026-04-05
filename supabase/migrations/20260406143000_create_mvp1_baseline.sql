create extension if not exists pgcrypto;

create table public.device_identities (
  id uuid primary key default gen_random_uuid(),
  anonymous_device_id text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_device_id uuid not null references public.device_identities(id),
  content varchar(100) not null,
  administrative_dong_name text not null,
  administrative_dong_code text not null,
  latitude double precision,
  longitude double precision,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_expires_at timestamptz not null default (now() + interval '3 minutes'),
  constraint posts_content_length_check check (char_length(content) between 1 and 100),
  constraint posts_status_check check (status in ('active', 'deleted'))
);

create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  device_id uuid not null references public.device_identities(id) on delete cascade,
  reaction_type text not null default 'agree',
  created_at timestamptz not null default now(),
  constraint post_reactions_type_check check (reaction_type in ('agree')),
  constraint post_reactions_unique unique (post_id, device_id, reaction_type)
);

create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_device_id uuid not null references public.device_identities(id) on delete cascade,
  reason_code text not null,
  created_at timestamptz not null default now(),
  constraint post_reports_reason_code_check check (
    reason_code in ('hate_or_abuse', 'misinformation', 'spam_or_ad', 'other_policy')
  ),
  constraint post_reports_unique unique (post_id, reporter_device_id)
);

create table public.abuse_logs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.device_identities(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_posts_active_created_at
  on public.posts (created_at desc)
  where status = 'active';

create index idx_posts_active_dong_code
  on public.posts (administrative_dong_code, created_at desc)
  where status = 'active';

create index idx_posts_active_created_at_with_coordinates
  on public.posts (created_at desc)
  where status = 'active' and latitude is not null and longitude is not null;

create index idx_post_reactions_post_id
  on public.post_reactions (post_id);

create index idx_post_reports_post_id
  on public.post_reports (post_id);

create unique index uq_posts_device_active_content
  on public.posts (author_device_id, content)
  where status = 'active';

create or replace function public.touch_device_identity()
returns trigger
language plpgsql
as $$
begin
  new.last_seen_at = now();
  return new;
end;
$$;

drop trigger if exists trg_device_identities_touch on public.device_identities;

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

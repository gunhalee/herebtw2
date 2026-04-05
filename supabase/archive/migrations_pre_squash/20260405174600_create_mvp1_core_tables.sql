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
  grid_cell_path text not null,
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

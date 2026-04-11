-- Phase 2: Candidate auth, replies, settings, and post extensions

-- candidates table
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name varchar(50) not null,
  district varchar(100) not null,
  email varchar(255) unique not null,
  first_message_id uuid references public.posts(id),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create index idx_candidates_district on public.candidates (district);
create index idx_candidates_auth_user_id on public.candidates (auth_user_id) where auth_user_id is not null;

-- extend posts table for candidate authored posts
alter table public.posts
  add column if not exists is_pinned boolean not null default false;

alter table public.posts
  add column if not exists author_type text not null default 'citizen'
    constraint posts_author_type_check check (author_type in ('citizen', 'candidate'));

alter table public.posts
  add column if not exists candidate_id uuid references public.candidates(id);

-- replies table (1:1 with posts)
create table public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id),
  content varchar(200) not null,
  is_promise boolean not null default false,
  promise_deadline date,
  created_at timestamptz not null default now(),
  constraint replies_post_unique unique (post_id),
  constraint replies_content_length_check check (char_length(content) between 1 and 200)
);

create index idx_replies_candidate_id on public.replies (candidate_id);
create index idx_replies_post_id on public.replies (post_id);
create index idx_replies_promises on public.replies (candidate_id, created_at desc) where is_promise = true;

-- settings table
create table public.settings (
  key varchar(50) primary key,
  value text not null
);

insert into public.settings (key, value) values
  ('election_date', '2026-06-03'),
  ('highlight_threshold', '3'),
  ('sort_switch_threshold', '10'),
  ('decay_half_life_hours', '72')
on conflict (key) do nothing;

-- Trigger: auto-update posts.reply_status when a reply is inserted
create or replace function public.on_reply_inserted()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.posts
    set reply_status = 'replied'
    where id = new.post_id
      and status = 'active';
  return new;
end;
$$;

drop trigger if exists trg_reply_update_post_status on public.replies;

create trigger trg_reply_update_post_status
after insert on public.replies
for each row
execute function public.on_reply_inserted();

-- RPC: list posts for a candidate's district (dashboard)
create or replace function public.list_district_posts(
  target_district text,
  viewer_candidate_id uuid default null,
  cursor_created_at timestamptz default null,
  cursor_post_id uuid default null,
  result_limit integer default 20
)
returns table (
  id uuid,
  public_uuid uuid,
  content varchar(100),
  administrative_dong_name text,
  created_at timestamptz,
  reply_status text,
  is_pinned boolean,
  author_type text,
  agree_count integer,
  has_reply boolean,
  reply_candidate_name text,
  reply_content varchar(200),
  reply_is_promise boolean,
  reply_promise_deadline date,
  reply_created_at timestamptz
)
language sql
stable
as $$
  with district_posts as (
    select
      p.id,
      p.public_uuid,
      p.content,
      p.administrative_dong_name,
      p.created_at,
      p.reply_status,
      p.is_pinned,
      p.author_type
    from public.posts p
    where p.status = 'active'
      and p.administrative_dong_name like '%' || target_district || '%'
      and (
        cursor_created_at is null
        or p.created_at < cursor_created_at
        or (p.created_at = cursor_created_at and p.id > cursor_post_id)
      )
  ),
  with_engagement as (
    select
      dp.*,
      coalesce(ev.agree_count, 0)::integer as agree_count
    from district_posts dp
    left join public.post_engagement_view ev on ev.post_id = dp.id
  ),
  with_replies as (
    select
      we.*,
      r.id is not null as has_reply,
      c.name as reply_candidate_name,
      r.content as reply_content,
      r.is_promise as reply_is_promise,
      r.promise_deadline as reply_promise_deadline,
      r.created_at as reply_created_at
    from with_engagement we
    left join public.replies r on r.post_id = we.id
    left join public.candidates c on c.id = r.candidate_id
  )
  select
    wr.id,
    wr.public_uuid,
    wr.content,
    wr.administrative_dong_name,
    wr.created_at,
    wr.reply_status,
    wr.is_pinned,
    wr.author_type,
    wr.agree_count,
    wr.has_reply,
    wr.reply_candidate_name,
    wr.reply_content,
    wr.reply_is_promise,
    wr.reply_promise_deadline,
    wr.reply_created_at
  from with_replies wr
  order by
    wr.is_pinned desc,
    case when wr.reply_status = 'delivered' then 0 else 1 end,
    wr.agree_count desc,
    wr.created_at desc,
    wr.id asc
  limit least(greatest(coalesce(result_limit, 20), 1), 51);
$$;

-- RPC: get post detail by uuid including reply data
drop function if exists public.get_post_by_uuid(uuid);

create or replace function public.get_post_by_uuid(target_uuid uuid)
returns table (
  id uuid,
  public_uuid uuid,
  content varchar(100),
  administrative_dong_name text,
  created_at timestamptz,
  reply_status text,
  agree_count integer,
  notification_email varchar(255),
  reply_id uuid,
  reply_candidate_name text,
  reply_content varchar(200),
  reply_is_promise boolean,
  reply_promise_deadline date,
  reply_created_at timestamptz
)
language sql
stable
as $$
  select
    p.id,
    p.public_uuid,
    p.content,
    p.administrative_dong_name,
    p.created_at,
    p.reply_status,
    coalesce(ev.agree_count, 0) as agree_count,
    p.notification_email,
    r.id as reply_id,
    c.name as reply_candidate_name,
    r.content as reply_content,
    r.is_promise as reply_is_promise,
    r.promise_deadline as reply_promise_deadline,
    r.created_at as reply_created_at
  from public.posts p
  left join public.post_engagement_view ev on ev.post_id = p.id
  left join public.replies r on r.post_id = p.id
  left join public.candidates c on c.id = r.candidate_id
  where p.public_uuid = target_uuid
    and p.status = 'active'
  limit 1;
$$;

-- RPC: get candidate dashboard stats
create or replace function public.get_candidate_dashboard_stats(target_district text)
returns table (
  total_posts bigint,
  replied_posts bigint,
  unreplied_posts bigint,
  reply_rate numeric
)
language sql
stable
as $$
  select
    count(*)::bigint as total_posts,
    count(*) filter (where p.reply_status = 'replied')::bigint as replied_posts,
    count(*) filter (where p.reply_status = 'delivered')::bigint as unreplied_posts,
    case
      when count(*) = 0 then 0
      else round(count(*) filter (where p.reply_status = 'replied')::numeric / count(*)::numeric * 100, 1)
    end as reply_rate
  from public.posts p
  where p.status = 'active'
    and p.author_type = 'citizen'
    and p.administrative_dong_name like '%' || target_district || '%';
$$;

-- RPC: list promises for a candidate (archive page)
create or replace function public.list_candidate_promises(target_candidate_id uuid)
returns table (
  reply_id uuid,
  post_id uuid,
  post_public_uuid uuid,
  post_content varchar(100),
  post_dong_name text,
  post_created_at timestamptz,
  reply_content varchar(200),
  reply_created_at timestamptz,
  promise_deadline date,
  candidate_name text,
  candidate_district text
)
language sql
stable
as $$
  select
    r.id as reply_id,
    p.id as post_id,
    p.public_uuid as post_public_uuid,
    p.content as post_content,
    p.administrative_dong_name as post_dong_name,
    p.created_at as post_created_at,
    r.content as reply_content,
    r.created_at as reply_created_at,
    r.promise_deadline,
    c.name as candidate_name,
    c.district as candidate_district
  from public.replies r
  inner join public.posts p on p.id = r.post_id
  inner join public.candidates c on c.id = r.candidate_id
  where r.candidate_id = target_candidate_id
    and r.is_promise = true
    and p.status = 'active'
  order by r.promise_deadline asc nulls last, r.created_at desc;
$$;

alter table public.posts
  add column location_source text not null default 'browser',
  add column location_scope text not null default 'dong';

alter table public.posts
  add constraint posts_location_source_check
    check (location_source in ('browser', 'manual', 'system')),
  add constraint posts_location_scope_check
    check (location_scope in ('dong', 'district', 'province'));

update public.posts
set
  location_source = 'system',
  location_scope = 'district'
where author_type = 'candidate';

comment on column public.posts.location_source is
  'How the posting area was established: browser geolocation, manual search, or system content.';

comment on column public.posts.location_scope is
  'Granularity of the posting area: administrative dong/eup/myeon, city/county/district, or province.';

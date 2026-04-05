create index idx_posts_active_created_at
  on public.posts (created_at desc)
  where status = 'active';

create index idx_posts_active_grid_cell_path
  on public.posts (grid_cell_path, created_at desc)
  where status = 'active';

create index idx_posts_active_dong_code
  on public.posts (administrative_dong_code, created_at desc)
  where status = 'active';

create index idx_post_reactions_post_id
  on public.post_reactions (post_id);

create index idx_post_reports_post_id
  on public.post_reports (post_id);

create unique index uq_posts_device_active_content
  on public.posts (author_device_id, content)
  where status = 'active';

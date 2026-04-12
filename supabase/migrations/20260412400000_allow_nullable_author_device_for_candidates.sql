-- Allow candidate-authored posts to have no device identity
alter table public.posts
  alter column author_device_id drop not null;

-- Candidate posts don't expire (set delete_expires_at far in the future)
-- The existing default is fine for citizen posts; we'll handle it in application logic.

-- Also relax the unique index so NULL device_id doesn't cause issues
-- (NULL values in unique indexes don't conflict, so existing index is already fine)

-- Extend delete_expires_at to be nullable for candidate-pinned posts
-- We'll just not enforce deletion window for is_pinned posts in the RPC
alter table public.posts
  alter column delete_expires_at drop not null;

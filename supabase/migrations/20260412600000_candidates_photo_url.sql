-- Add profile photo URL to candidates table
alter table public.candidates
  add column if not exists photo_url text;

-- Create a public Supabase Storage bucket for candidate photos
-- (run this separately if the bucket doesn't exist yet)
-- insert into storage.buckets (id, name, public)
-- values ('candidate-photos', 'candidate-photos', true)
-- on conflict (id) do nothing;

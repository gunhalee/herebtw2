-- Add election district columns to candidates
-- metro_council_district: 시·도의회 선거구명 (e.g. "중·성동 제1선거구")
-- local_council_district: 구·시·군의회 선거구명 (e.g. "나선거구")

alter table public.candidates
  add column if not exists metro_council_district text,
  add column if not exists local_council_district text;

create index if not exists idx_candidates_metro_council_district
  on public.candidates (metro_council_district)
  where metro_council_district is not null;

create index if not exists idx_candidates_local_council_district
  on public.candidates (local_council_district)
  where local_council_district is not null;

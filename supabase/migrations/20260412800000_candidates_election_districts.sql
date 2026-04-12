-- Add election district columns to candidates
-- metro_council_district: 시·도의회 선거구명 (e.g. "중·성동 제1선거구")
-- local_council_district: 구·시·군의회 선거구명 — "{시군구명} {선거구명}" 형식으로 저장
--   (e.g. "중구 나선거구"). "나선거구"만 저장하면 다른 시군구와 중복되므로 반드시 시군구명 포함.

alter table public.candidates
  add column if not exists metro_council_district text,
  add column if not exists local_council_district text;

create index if not exists idx_candidates_metro_council_district
  on public.candidates (metro_council_district)
  where metro_council_district is not null;

create index if not exists idx_candidates_local_council_district
  on public.candidates (local_council_district)
  where local_council_district is not null;

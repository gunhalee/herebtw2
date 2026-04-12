-- 후보자 의회 구분 컬럼
-- '시도의회' | '구의회' | '시의회' | '군의회'
alter table public.candidates
  add column if not exists council_type text
    constraint candidates_council_type_check
      check (council_type in ('시도의회', '구의회', '시의회', '군의회'));

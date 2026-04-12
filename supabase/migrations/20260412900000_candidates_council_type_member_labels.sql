-- council_type 값 체계를 "~의회"에서 "~의원"으로 전환한다.
-- 기존 데이터는 일괄 변환하고, 체크 제약도 의원 기준으로 갱신한다.

alter table public.candidates
  drop constraint if exists candidates_council_type_check;

update public.candidates
set council_type = case council_type
  when '시도의회' then '시도의원'
  when '구의회' then '구의원'
  when '시의회' then '시의원'
  when '군의회' then '군의원'
  else council_type
end
where council_type in ('시도의회', '구의회', '시의회', '군의회');

alter table public.candidates
  add constraint candidates_council_type_check
  check (council_type in ('시도의원', '구의원', '시의원', '군의원'));

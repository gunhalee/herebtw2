-- candidates 테이블에 area_code_prefix 컬럼 추가.
-- 시도의원: 시도 코드 앞 2자리 (예: '11')
-- 구시군의원: 시군구 코드 앞 5자리 (예: '11680')
-- 피드에서 시청자의 동 코드와 prefix 매칭으로 지역구 후보 답변을 최우선 정렬할 때 사용.

alter table public.candidates
  add column if not exists area_code_prefix varchar(5) null;

comment on column public.candidates.area_code_prefix is
  '지역구 동 코드 prefix: 시도의원은 2자리, 구시군의원은 5자리. 피드 구역 정렬용.';

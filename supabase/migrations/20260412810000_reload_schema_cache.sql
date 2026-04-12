-- PostgREST 스키마 캐시 강제 리로드
-- (metro_council_district, local_council_district 컬럼 추가 후 반영)
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
end $$;

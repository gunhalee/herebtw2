-- Normalize legacy geo:kr:* location identifiers to the largest verified
-- administrative unit. New browser/manual location tokens already carry a
-- 10-digit Kakao H-code; this branch preserves older posts without guessing a
-- dong or district code.

set lock_timeout = '5s';
set statement_timeout = '2min';

create or replace function private.ensure_post_location_area()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_code text;
  province_code text;
  province_name text;
  district_code text;
  selected_code text;
  legacy_province text;
begin
  if new.author_type <> 'citizen' then
    new.location_area_code := null;
    return new;
  end if;

  source_code := new.administrative_dong_code;

  if source_code ~ '^[0-9]{10}$' then
    province_code := left(source_code, 2) || '00000000';
    district_code := left(source_code, 5) || '00000';

    insert into public.administrative_areas (code, name, level, parent_code)
    values (province_code, province_code, 'province', null)
    on conflict (code) do nothing;

    if district_code <> province_code then
      insert into public.administrative_areas (code, name, level, parent_code)
      values (district_code, district_code, 'district', province_code)
      on conflict (code) do nothing;
    end if;

    if source_code not in (province_code, district_code) then
      insert into public.administrative_areas (code, name, level, parent_code)
      values (source_code, new.administrative_dong_name, 'dong', district_code)
      on conflict (code) do update
        set name = excluded.name,
            is_active = true,
            updated_at = now();
    end if;

    selected_code := case new.location_scope
      when 'province' then province_code
      when 'district' then district_code
      else source_code
    end;
    new.location_area_code := selected_code;

    insert into public.administrative_area_closure (ancestor_code, descendant_code, depth)
    values (province_code, province_code, 0)
    on conflict do nothing;

    if district_code <> province_code then
      insert into public.administrative_area_closure (ancestor_code, descendant_code, depth)
      values
        (district_code, district_code, 0),
        (province_code, district_code, 1)
      on conflict do nothing;
    end if;

    if source_code not in (province_code, district_code) then
      insert into public.administrative_area_closure (ancestor_code, descendant_code, depth)
      values
        (source_code, source_code, 0),
        (district_code, source_code, 1),
        (province_code, source_code, 2)
      on conflict do nothing;
    end if;

    return new;
  end if;

  if source_code like 'geo:kr:%' then
    legacy_province := split_part(source_code, ':', 3);
    select mapping.code, mapping.name
      into province_code, province_name
    from (values
      ('서울', '1100000000', '서울특별시'),
      ('서울특별시', '1100000000', '서울특별시'),
      ('부산', '2600000000', '부산광역시'),
      ('부산광역시', '2600000000', '부산광역시'),
      ('대구', '2700000000', '대구광역시'),
      ('대구광역시', '2700000000', '대구광역시'),
      ('인천', '2800000000', '인천광역시'),
      ('인천광역시', '2800000000', '인천광역시'),
      ('광주', '2900000000', '광주광역시'),
      ('광주광역시', '2900000000', '광주광역시'),
      ('대전', '3000000000', '대전광역시'),
      ('대전광역시', '3000000000', '대전광역시'),
      ('울산', '3100000000', '울산광역시'),
      ('울산광역시', '3100000000', '울산광역시'),
      ('세종', '3600000000', '세종특별자치시'),
      ('세종특별자치시', '3600000000', '세종특별자치시'),
      ('경기', '4100000000', '경기도'),
      ('경기도', '4100000000', '경기도'),
      ('강원', '5100000000', '강원특별자치도'),
      ('강원특별자치도', '5100000000', '강원특별자치도'),
      ('충북', '4300000000', '충청북도'),
      ('충청북도', '4300000000', '충청북도'),
      ('충남', '4400000000', '충청남도'),
      ('충청남도', '4400000000', '충청남도'),
      ('전북', '5200000000', '전북특별자치도'),
      ('전북특별자치도', '5200000000', '전북특별자치도'),
      ('전남', '4600000000', '전라남도'),
      ('전라남도', '4600000000', '전라남도'),
      ('경북', '4700000000', '경상북도'),
      ('경상북도', '4700000000', '경상북도'),
      ('경남', '4800000000', '경상남도'),
      ('경상남도', '4800000000', '경상남도'),
      ('제주', '5000000000', '제주특별자치도'),
      ('제주특별자치도', '5000000000', '제주특별자치도')
    ) as mapping(alias, code, name)
    where mapping.alias = legacy_province
    limit 1;

    if province_code is not null then
      insert into public.administrative_areas (code, name, level, parent_code, source)
      values (province_code, province_name, 'province', null, 'legacy_geo_kr')
      on conflict (code) do update
        set name = excluded.name,
            is_active = true,
            updated_at = now();

      insert into public.administrative_area_closure (ancestor_code, descendant_code, depth)
      values (province_code, province_code, 0)
      on conflict do nothing;

      new.location_area_code := province_code;
      new.location_scope := 'province';
      return new;
    end if;
  end if;

  new.location_area_code := null;
  return new;
end;
$$;

update public.posts
set administrative_dong_code = administrative_dong_code
where author_type = 'citizen'
  and administrative_dong_code like 'geo:kr:%'
  and location_area_code is null;

-- Support party leader candidates whose constituency is nationwide.
-- The existing column name is retained to avoid a broad API migration; its
-- value is rendered as the candidate badge throughout the current UI.

alter table public.candidates
  drop constraint if exists candidates_council_type_check;

alter table public.candidates
  add constraint candidates_council_type_check
  check (council_type in ('시도의원', '구의원', '시의원', '군의원', '당대표'));

alter table public.candidates
  add constraint candidates_national_party_leader_scope_check
  check (
    council_type <> '당대표'
    or (
      district = '전국'
      and local_council_district is null
      and metro_council_district is null
    )
  );

create index if not exists idx_candidates_national_party_leader_messages
  on public.candidates (council_type, id)
  where council_type = '당대표'
    and is_active
    and first_message_id is not null;

comment on constraint candidates_national_party_leader_scope_check
  on public.candidates is
  '당대표 후보는 district=전국이며 지방의회 선거구를 갖지 않는다.';

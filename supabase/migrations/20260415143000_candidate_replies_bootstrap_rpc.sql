create or replace function public.get_candidate_replies_bootstrap(
  target_candidate_id uuid,
  result_limit integer default 10,
  cursor_reply_created_at timestamptz default null,
  cursor_reply_id uuid default null
)
returns jsonb
language sql
stable
as $$
with bounded_limit as (
  select least(greatest(coalesce(result_limit, 10), 1), 50) as value
),
candidate_source as (
  select
    candidate.id,
    candidate.name,
    candidate.district,
    candidate.photo_url,
    candidate.metro_council_district,
    candidate.local_council_district,
    candidate.council_type,
    candidate.first_message_id,
    first_message.content as first_message_content,
    first_message.public_uuid as first_message_public_uuid
  from public.candidates as candidate
  left join public.posts as first_message
    on first_message.id = candidate.first_message_id
  where candidate.id = target_candidate_id
  limit 1
),
reply_source as (
  select
    reply.id as reply_id,
    reply.created_at as reply_created_at,
    projection.post_id,
    projection.public_uuid,
    projection.content,
    projection.administrative_dong_name,
    projection.agree_count,
    projection.latest_reply_candidate_name as reply_candidate_name,
    projection.latest_reply_candidate_photo_url as reply_candidate_photo_url,
    projection.latest_reply_candidate_local_council_district as reply_candidate_local_council_district,
    projection.latest_reply_candidate_council_type as reply_candidate_council_type,
    projection.latest_reply_content as reply_content,
    projection.latest_reply_is_promise as reply_is_promise
  from public.replies as reply
  inner join public.post_feed_projection as projection
    on projection.post_id = reply.post_id
  where reply.candidate_id = target_candidate_id
    and (
      cursor_reply_created_at is null
      or reply.created_at < cursor_reply_created_at
      or (
        cursor_reply_id is not null
        and reply.created_at = cursor_reply_created_at
        and reply.id > cursor_reply_id
      )
    )
  order by reply.created_at desc, reply.id asc
  limit (
    select value + 1
    from bounded_limit
  )
),
page_rows as (
  select *
  from reply_source
  order by reply_created_at desc, reply_id asc
  limit (
    select value
    from bounded_limit
  )
),
page_boundary as (
  select
    exists(
      select 1
      from reply_source
      offset (
        select value
        from bounded_limit
      )
      limit 1
    ) as has_more,
    page_row.reply_created_at,
    page_row.reply_id
  from page_rows as page_row
  order by page_row.reply_created_at asc, page_row.reply_id desc
  limit 1
)
select
  case
    when not exists(select 1 from candidate_source) then null
    else jsonb_build_object(
      'candidate',
      (
        select jsonb_build_object(
          'id', candidate.id,
          'name', candidate.name,
          'district', candidate.district,
          'photoUrl', candidate.photo_url,
          'metroCouncilDistrict', candidate.metro_council_district,
          'localCouncilDistrict', candidate.local_council_district,
          'councilType', candidate.council_type
        )
        from candidate_source as candidate
      ),
      'candidateMessageCard',
      (
        select case
          when candidate.first_message_id is null
            or candidate.first_message_content is null
            or candidate.first_message_public_uuid is null
          then null
          else jsonb_build_object(
            'id', candidate.id,
            'name', candidate.name,
            'district', candidate.district,
            'photoUrl', candidate.photo_url,
            'firstMessageContent', candidate.first_message_content,
            'firstMessagePublicUuid', candidate.first_message_public_uuid,
            'metroCouncilDistrict', candidate.metro_council_district,
            'localCouncilDistrict', candidate.local_council_district,
            'councilType', candidate.council_type,
            'matchType', 'other'
          )
        end
        from candidate_source as candidate
      ),
      'items',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'postId', row.post_id,
              'publicUuid', row.public_uuid,
              'content', row.content,
              'administrativeDongName', row.administrative_dong_name,
              'agreeCount', row.agree_count,
              'replyCandidateName', row.reply_candidate_name,
              'replyCandidatePhotoUrl', row.reply_candidate_photo_url,
              'replyCandidateLocalCouncilDistrict', row.reply_candidate_local_council_district,
              'replyCandidateCouncilType', row.reply_candidate_council_type,
              'replyContent', row.reply_content,
              'replyCreatedAt', row.reply_created_at,
              'replyIsPromise', row.reply_is_promise
            )
            order by row.reply_created_at desc, row.reply_id asc
          )
          from page_rows as row
        ),
        '[]'::jsonb
      ),
      'nextCursor',
      (
        select case
          when boundary.has_more
            and boundary.reply_created_at is not null
            and boundary.reply_id is not null
          then jsonb_build_object(
            'createdAt', boundary.reply_created_at,
            'replyId', boundary.reply_id
          )
          else null
        end
        from page_boundary as boundary
      )
    )
  end;
$$;

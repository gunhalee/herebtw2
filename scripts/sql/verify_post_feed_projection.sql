select jsonb_build_object(
  'post_feed_projection',
  jsonb_build_object(
    'exists',
    to_regclass('public.post_feed_projection') is not null,
    'columns',
    coalesce(
      (
        select jsonb_agg(column_name order by ordinal_position)
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'post_feed_projection'
      ),
      '[]'::jsonb
    )
  ),
  'post_engagement_view',
  jsonb_build_object(
    'exists',
    to_regclass('public.post_engagement_view') is not null
  ),
  'functions',
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'name', proname,
          'identity', oid::regprocedure::text,
          'arguments', pg_get_function_identity_arguments(oid),
          'result', pg_get_function_result(oid)
        )
        order by oid::regprocedure::text
      )
      from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname in ('list_posts_feed', 'get_post_by_uuid', 'toggle_post_agree')
    ),
    '[]'::jsonb
  ),
  'triggers',
  coalesce(
    (
      select jsonb_object_agg(event_object_table, trigger_names)
      from (
        select
          event_object_table,
          jsonb_agg(trigger_name order by trigger_name) as trigger_names
        from information_schema.triggers
        where trigger_schema = 'public'
          and event_object_table in ('posts', 'replies', 'post_reactions', 'candidates')
        group by event_object_table
      ) as trigger_rows
    ),
    '{}'::jsonb
  ),
  'indexes',
  coalesce(
    (
      select jsonb_object_agg(tablename, index_names)
      from (
        select
          tablename,
          jsonb_agg(indexname order by indexname) as index_names
        from pg_indexes
        where schemaname = 'public'
          and tablename in ('post_feed_projection', 'post_reports', 'post_reactions')
        group by tablename
      ) as index_rows
    ),
    '{}'::jsonb
  )
) as verification;

# Supabase Migrations

`supabase/migrations` contains the MVP 1 schema split into execution-order files.

Order:

1. `20260405174500_enable_pgcrypto.sql`
2. `20260405174600_create_mvp1_core_tables.sql`
3. `20260405174700_create_mvp1_indexes.sql`
4. `20260405174800_create_mvp1_functions_and_views.sql`

`herebtw_mvp1_migration_draft.sql` remains as a single-file reference draft.

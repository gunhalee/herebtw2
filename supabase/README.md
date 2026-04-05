# Supabase Migrations

`supabase/migrations` now keeps a single baseline for the current MVP 1 schema:

1. `20260406143000_create_mvp1_baseline.sql`

That baseline reflects the coordinate-based post model:

- `posts.latitude` / `posts.longitude` are present
- `posts.grid_cell_path` is gone
- functions, triggers, and the engagement view are included in the same file

Pre-squash migration history is preserved under `supabase/archive/migrations_pre_squash`.

`herebtw_mvp1_migration_draft.sql` remains as a single-file reference draft.

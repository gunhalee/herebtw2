import { readFile } from "node:fs/promises";
import pg from "pg";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) throw new Error("Missing SUPABASE_DB_PASSWORD.");
const poolerUrl = new URL((await readFile("supabase/.temp/pooler-url", "utf8")).trim());
poolerUrl.password = password;
const client = new pg.Client({ connectionString: poolerUrl.toString(), ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const tables = await client.query(`
      select count(*)::int as table_count, bool_and(c.relrowsecurity) as all_rls
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = any($1::text[])
    `, [[
      "moderation_cases", "moderation_evidence", "moderation_decisions",
      "moderation_decision_cache", "moderation_provider_usage",
      "moderation_notification_outbox", "moderation_access_audit",
    ]]);
  const grants = await client.query(`
      select count(*)::int as exposed_grants
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name like 'moderation_%'
        and grantee in ('anon', 'authenticated', 'PUBLIC')
    `);
  const queue = await client.query(`select exists (
      select 1 from pgmq.list_queues() where queue_name = 'content_moderation'
    ) as queue_exists`);
  const passed = tables.rows[0].table_count === 7
    && tables.rows[0].all_rls === true
    && grants.rows[0].exposed_grants === 0
    && queue.rows[0].queue_exists === true;
  console.log(JSON.stringify({
    passed,
    moderationTables: tables.rows[0].table_count,
    allRls: tables.rows[0].all_rls,
    exposedGrants: grants.rows[0].exposed_grants,
    queueExists: queue.rows[0].queue_exists,
  }));
  if (!passed) process.exitCode = 1;
} finally {
  await client.end();
}

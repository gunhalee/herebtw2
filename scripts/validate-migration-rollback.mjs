import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";

const migrationPath = process.argv[2];
if (!migrationPath) throw new Error("Usage: validate-migration-rollback.mjs <migration.sql>");
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) throw new Error("Missing SUPABASE_DB_PASSWORD.");

const poolerUrl = new URL((await readFile("supabase/.temp/pooler-url", "utf8")).trim());
poolerUrl.password = password;
const client = new pg.Client({
  connectionString: poolerUrl.toString(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query("begin");
  await client.query(await readFile(migrationPath, "utf8"));
  const result = await client.query(`
    select
      to_regclass('public.moderation_cases') is not null as cases_ok,
      to_regclass('pgmq.q_content_moderation') is not null as queue_ok
  `);
  const device = await client.query(`
    insert into public.device_identities (anonymous_device_id)
    values ($1) returning id
  `, [`migration-smoke-${randomUUID()}`]);
  const casePublicId = randomUUID();
  const created = await client.query(`
    select * from public.create_quarantined_post(
      p_case_public_id => $1::uuid,
      p_author_device_id => $2::uuid,
      p_client_request_id => $3::uuid,
      p_candidate_id => null::uuid,
      p_author_type => 'citizen'::text,
      p_placeholder_content => '안전 확인 중인 글입니다.'::text,
      p_administrative_dong_name => '테스트동'::text,
      p_administrative_dong_code => '0000000000'::text,
      p_latitude => 37.5::double precision,
      p_longitude => 127.0::double precision,
      p_latitude_bucket_100m => 37500::double precision,
      p_longitude_bucket_100m => 127000::double precision,
      p_location_scope => 'dong'::text,
      p_location_source => 'browser'::text,
      p_notification_email => null::text,
      p_notification_email_verification_hash => null::text,
      p_notification_email_verification_expires_at => null::timestamptz,
      p_content_hmac => $4::text,
      p_source => 'citizen_post'::text,
      p_priority => 'urgent'::text,
      p_risk_band => 'critical'::text,
      p_reason_codes => array['migration_smoke']::text[],
      p_policy_version => 'migration-smoke-v1'::text,
      p_normalization_version => 2::smallint,
      p_ciphertext_base64 => 'dGVzdA=='::text,
      p_evidence_created_at => now()::timestamptz,
      p_nonce_base64 => 'MTIzNDU2Nzg5MDEy'::text,
      p_auth_tag_base64 => 'MTIzNDU2Nzg5MDEyMzQ1Ng=='::text,
      p_key_version => 'v-test'::text,
      p_aad_version => 1::smallint
    )
  `, [casePublicId, device.rows[0].id, randomUUID(), "a".repeat(64)]);
  const jobs = await client.query("select * from public.claim_content_moderation_jobs(60, 1)");
  if (jobs.rows[0]) {
    await client.query("select public.complete_content_moderation_job($1)", [jobs.rows[0].msg_id]);
  }
  await client.query(`
    select public.apply_moderation_decision(
      $1::uuid, 'reject'::text, 'migration-smoke'::text, 'migration_smoke'::text, ''::text,
      null::text, null::text, null::text, null::text, null::text,
      2::smallint, 'migration-smoke-v1'::text
    )
  `, [casePublicId]);
  const rejectedDecision = await client.query(`
    select c.state, p.status
    from public.moderation_cases c join public.posts p on p.id = c.post_id
    where c.public_id = $1
  `, [casePublicId]);
  await client.query(`
    select public.apply_moderation_decision(
      $1::uuid, 'restore'::text, 'migration-smoke'::text, 'migration_restore'::text, ''::text,
      '검증된 테스트 글'::text, '검증된 테스트 글'::text, '검증된테스트글'::text,
      $2::text, $3::text, 2::smallint, 'migration-smoke-v1'::text
    )
  `, [casePublicId, "b".repeat(64), "c".repeat(64)]);
  const restoredDecision = await client.query(`
    select c.state, p.status, p.content
    from public.moderation_cases c join public.posts p on p.id = c.post_id
    where c.public_id = $1
  `, [casePublicId]);
  console.log(JSON.stringify({
    ...result.rows[0],
    create_ok: created.rowCount === 1,
    reject_ok: rejectedDecision.rows[0]?.state === "rejected" && rejectedDecision.rows[0]?.status === "hidden",
    restore_ok: restoredDecision.rows[0]?.state === "published"
      && restoredDecision.rows[0]?.status === "active"
      && restoredDecision.rows[0]?.content === "검증된 테스트 글",
    queue_ok: jobs.rowCount === 1,
  }));
} finally {
  await client.query("rollback").catch(() => undefined);
  await client.end();
}

const { Client } = require("pg");

const client = new Client({
  host: "db.hbwzuajuzeuubvsalejh.supabase.co",
  port: 5432,
  user: "postgres",
  password: "8yZf%sjvQZuGg@*",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected.");

  await client.query(`
    alter table public.candidates
      add column if not exists metro_council_district text,
      add column if not exists local_council_district text
  `);
  console.log("ALTER TABLE done.");

  await client.query(`
    create index if not exists idx_candidates_metro_council_district
      on public.candidates (metro_council_district)
      where metro_council_district is not null
  `);
  await client.query(`
    create index if not exists idx_candidates_local_council_district
      on public.candidates (local_council_district)
      where local_council_district is not null
  `);
  console.log("Indexes created.");

  const { rows } = await client.query(
    `select column_name, data_type, is_nullable
     from information_schema.columns
     where table_name = 'candidates'
     order by ordinal_position`
  );
  console.log("\ncandidates 컬럼 목록:");
  console.table(rows);

  await client.end();
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  client.end();
  process.exit(1);
});

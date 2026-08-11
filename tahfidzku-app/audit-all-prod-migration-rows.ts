import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const PROD_DB_URL = "postgresql://neondb_owner:npg_jhNmlqT0kKn5@ep-twilight-feather-ao5fmi2r-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function auditAllProdMigrationRows() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  FULL RECONCILIATION: DRIZZLE MIGRATIONS TRACKER IN PROD DB');
  console.log('════════════════════════════════════════════════════════════\n');

  const journalPath = path.join(process.cwd(), 'src/db/migrations/meta/_journal.json');
  const journalData = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  const journalEntries = journalData.entries;

  const pool = new Pool({ connectionString: PROD_DB_URL });

  try {
    const res = await pool.query(`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY id ASC;
    `);

    console.log(`Total rows in Prod DB drizzle.__drizzle_migrations: ${res.rows.length}\n`);

    const comparison = res.rows.map((row, index) => {
      const journalEntry = journalEntries.find((j: any) => j.idx === index);
      return {
        db_id: row.id,
        db_hash: row.hash,
        db_created_at: new Date(Number(row.created_at)).toISOString(),
        journal_tag: journalEntry ? journalEntry.tag : 'UNKNOWN (NOT IN JOURNAL)',
      };
    });

    console.table(comparison);

  } catch (err: any) {
    console.error('❌ Migration reconciliation error:', err.message);
  } finally {
    await pool.end();
  }
}

auditAllProdMigrationRows().catch(console.error);

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './src/db/index.js';

async function setup() {
  try {
    console.log('Adding hari_masuk to santri...');
    await db.execute(sql`ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "hari_masuk" "hari"[] DEFAULT '{}'::hari[] NOT NULL;`);
    console.log('Adding min_hari_masuk_santri to tenants...');
    await db.execute(sql`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "min_hari_masuk_santri" integer DEFAULT 2 NOT NULL;`);
    console.log('Done setup DB.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
setup();

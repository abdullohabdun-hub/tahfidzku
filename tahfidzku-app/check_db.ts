import { db } from './src/db';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function check() {
  try {
    const res = await db.execute(sqlSELECT column_name FROM information_schema.columns WHERE table_name = 'santri');
    console.log(res.rows.map(r => r.column_name));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();

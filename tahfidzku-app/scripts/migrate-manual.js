import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/Users/fahmi/Documents/Tahfidzku/tahfidzku-app/.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log('Creating enum type...');
    await sql`CREATE TYPE "public"."sumber_setoran" AS ENUM('ustadz', 'santri_self_report');`;
    console.log('Enum created.');
  } catch(e) {
    console.log('Enum may already exist:', e.message);
  }
  
  try {
    console.log('Altering table...');
    await sql`ALTER TABLE "setoran" ADD COLUMN "sumber" "sumber_setoran" DEFAULT 'ustadz' NOT NULL;`;
    console.log('Column added.');
  } catch(e) {
    console.log('Column may already exist:', e.message);
  }
  process.exit(0);
}
run();

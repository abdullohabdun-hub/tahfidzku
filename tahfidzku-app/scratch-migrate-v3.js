import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/Users/fahmi/Documents/Tahfidzku/tahfidzku-app/.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log('Altering table...');
    await sql`ALTER TABLE "setoran" ADD COLUMN "updated_by" uuid;`;
    await sql`ALTER TABLE "setoran" ADD COLUMN "previous_data" jsonb;`;
    console.log('Columns added.');
  } catch(e) {
    console.log('Columns may already exist:', e.message);
  }
  
  try {
    console.log('Adding FK constraint...');
    await sql`ALTER TABLE "setoran" ADD CONSTRAINT "setoran_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;`;
    console.log('FK added.');
  } catch(e) {
    console.log('FK constraint error:', e.message);
  }

  process.exit(0);
}
run();

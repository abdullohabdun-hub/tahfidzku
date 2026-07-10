import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    console.log('Starting migration...');
    try { await sql`ALTER TABLE "setoran" ADD COLUMN "juz_mulai" integer;`; } catch (e) { console.log(e.message); }
    try { await sql`ALTER TABLE "setoran" ADD COLUMN "juz_selesai" integer;`; } catch (e) { console.log(e.message); }
    try { await sql`ALTER TABLE "setoran" ADD COLUMN "lintas_juz" boolean DEFAULT false;`; } catch (e) { console.log(e.message); }
    try { await sql`ALTER TABLE "setoran" ADD COLUMN "surah_meta" jsonb;`; } catch (e) { console.log(e.message); }
    try { await sql`ALTER TABLE "setoran" ALTER COLUMN "halaman_awal" TYPE real;`; } catch (e) { console.log(e.message); }
    try { await sql`ALTER TABLE "setoran" ALTER COLUMN "halaman_akhir" TYPE real;`; } catch (e) { console.log(e.message); }
    try { await sql`ALTER TABLE "santri" ADD COLUMN "posisi_terakhir" jsonb;`; } catch (e) { console.log(e.message); }
    
    console.log('Migration completed');
  } catch (err) {
    console.error(err);
  }
}
main();

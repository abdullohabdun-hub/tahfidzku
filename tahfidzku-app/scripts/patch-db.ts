import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function patchDatabase() {
  console.log('Patching remote Neon DB...');
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // 1. Santri Table Updates
    console.log('Adding urutan_hafalan to santri...');
    await sql`ALTER TABLE santri ADD COLUMN IF NOT EXISTS urutan_hafalan integer[] DEFAULT '{1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30}';`;
    await sql`UPDATE santri SET urutan_hafalan = '{1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30}' WHERE urutan_hafalan IS NULL;`;
    await sql`ALTER TABLE santri ALTER COLUMN urutan_hafalan SET NOT NULL;`;

    console.log('Adding posisi_terakhir to santri...');
    await sql`ALTER TABLE santri ADD COLUMN IF NOT EXISTS posisi_terakhir jsonb;`;

    // 2. Setoran Table Updates
    console.log('Adding columns to setoran...');
    await sql`ALTER TABLE setoran ADD COLUMN IF NOT EXISTS juz_mulai integer;`;
    await sql`ALTER TABLE setoran ADD COLUMN IF NOT EXISTS juz_selesai integer;`;
    await sql`ALTER TABLE setoran ADD COLUMN IF NOT EXISTS lintas_juz boolean DEFAULT false;`;
    await sql`ALTER TABLE setoran ADD COLUMN IF NOT EXISTS surah_meta jsonb;`;

    console.log('Altering halaman_awal and halaman_akhir to real...');
    await sql`ALTER TABLE setoran ALTER COLUMN halaman_awal TYPE real;`;
    await sql`ALTER TABLE setoran ALTER COLUMN halaman_akhir TYPE real;`;

    console.log('Patch successful!');
  } catch (err) {
    console.error('Patch failed:', err);
  }
}

patchDatabase();

import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
import { Client } from 'pg';

async function findAffectedSantri() {
  console.log('Mencari santri yang terkena bug cross-surah...');
  
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const query = `
    WITH LastZiyadah AS (
      SELECT DISTINCT ON (santri_id) 
        id, 
        santri_id, 
        surah_meta, 
        ayat_akhir,
        tanggal_setoran
      FROM setoran
      WHERE jenis = 'ziyadah'
      ORDER BY santri_id, tanggal_setoran DESC, created_at DESC
    )
    SELECT 
      s.id as santri_id,
      s.nama as santri_nama,
      s.posisi_terakhir,
      lz.surah_meta,
      lz.ayat_akhir
    FROM LastZiyadah lz
    JOIN santri s ON s.id = lz.santri_id
    WHERE 
      lz.surah_meta->'meta'->0->'surahMulai'->>'nomor' IS NOT NULL 
      AND lz.surah_meta->'meta'->0->'surahSelesai'->>'nomor' IS NOT NULL
      AND lz.surah_meta->'meta'->0->'surahMulai'->>'nomor' != lz.surah_meta->'meta'->0->'surahSelesai'->>'nomor'
  `;

  const res = await client.query(query);
  const rows = res.rows;

  if (rows.length === 0) {
    console.log('Tidak ada santri yang terkena bug lintas surah.');
    await client.end();
    return;
  }

  let affectedCount = 0;
  for (const row of rows) {
    const sm = row.surah_meta;
    const surahMulaiNo = parseInt(sm?.meta?.[0]?.surahMulai?.nomor);
    const surahSelesaiNo = parseInt(sm?.meta?.[0]?.surahSelesai?.nomor);
    const posisiSurahNo = row.posisi_terakhir?.surahNomor;
    const posisiAyat = row.posisi_terakhir?.ayat;

    if (posisiSurahNo === surahMulaiNo && surahMulaiNo !== surahSelesaiNo) {
      affectedCount++;
      console.log(`\n- Santri: ${row.santri_nama} (ID: ${row.santri_id})`);
      console.log(`  Setoran Ziyadah Terakhir: Surah ${surahMulaiNo} -> Surah ${surahSelesaiNo} (Ayat Akhir: ${row.ayat_akhir})`);
      console.log(`  Posisi Saat Ini (Salah): Surah ${posisiSurahNo}, Ayat ${posisiAyat}`);
      console.log(`  Seharusnya (Benar): Surah ${surahSelesaiNo}, Ayat ${row.ayat_akhir}`);
    }
  }

  console.log(`\nTotal santri yang perlu dikoreksi: ${affectedCount}`);
  await client.end();
}

findAffectedSantri().catch(console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
import { Client } from 'pg';

async function auditCrossSurah() {
  console.log('--- AUDIT KESELURUHAN SEJARAH CROSS-SURAH ZIYADAH ---');
  
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Cari semua setoran ziyadah yang bersifat lintas surah
  const query = `
    SELECT 
      id, santri_id, surah_meta, ayat_akhir, tanggal_setoran, created_at
    FROM setoran
    WHERE jenis = 'ziyadah'
      AND surah_meta->'meta'->0->'surahMulai'->>'nomor' IS NOT NULL 
      AND surah_meta->'meta'->0->'surahSelesai'->>'nomor' IS NOT NULL
      AND surah_meta->'meta'->0->'surahMulai'->>'nomor' != surah_meta->'meta'->0->'surahSelesai'->>'nomor'
    ORDER BY tanggal_setoran ASC, created_at ASC
  `;

  const res = await client.query(query);
  const crossSurahs = res.rows;

  console.log(`Ditemukan ${crossSurahs.length} kejadian cross-surah dalam sejarah aplikasi.`);

  let affectedSantri = new Set();
  let cascadingErrors = 0;

  for (const cs of crossSurahs) {
    const santriId = cs.santri_id;
    const sm = cs.surah_meta;
    const surahMulaiNo = parseInt(sm?.meta?.[0]?.surahMulai?.nomor);
    const surahSelesaiNo = parseInt(sm?.meta?.[0]?.surahSelesai?.nomor);
    
    // Cari setoran Ziyadah SETELAH kejadian ini untuk santri yang sama
    const nextQuery = `
      SELECT id, surah_meta, tanggal_setoran, ayat_awal 
      FROM setoran 
      WHERE santri_id = $1 
        AND jenis = 'ziyadah' 
        AND (tanggal_setoran > $2 OR (tanggal_setoran = $2 AND created_at > $3))
      ORDER BY tanggal_setoran ASC, created_at ASC
      LIMIT 1
    `;
    const nextRes = await client.query(nextQuery, [santriId, cs.tanggal_setoran, cs.created_at]);
    
    if (nextRes.rows.length > 0) {
      const nextSetoran = nextRes.rows[0];
      const nextSm = nextSetoran.surah_meta;
      const nextMulaiNo = parseInt(nextSm?.meta?.[0]?.surahMulai?.nomor);
      
      // Jika setoran berikutnya dilanjutkan dari surah yang SALAH (surahMulai sebelumnya)
      if (nextMulaiNo === surahMulaiNo) {
        cascadingErrors++;
        affectedSantri.add(santriId);
        console.log(`\n🚨 Ditemukan Cascading Error (Efek Domino)!`);
        console.log(`  Santri ID: ${santriId}`);
        console.log(`  Setoran Cross-Surah: Surah ${surahMulaiNo} -> Surah ${surahSelesaiNo} (Pada ${cs.tanggal_setoran})`);
        console.log(`  Setoran BERIKUTNYA salah mulai dari Surah ${nextMulaiNo} (Seharusnya ${surahSelesaiNo}) (Pada ${nextSetoran.tanggal_setoran})`);
      }
    }
  }

  console.log(`\nRingkasan Audit:`);
  console.log(`- Total insiden efek domino (cascading error): ${cascadingErrors}`);
  console.log(`- Total santri yang riwayatnya korup beruntun: ${affectedSantri.size}`);

  await client.end();
}

auditCrossSurah().catch(console.error);

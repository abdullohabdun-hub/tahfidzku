import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { db } from '../src/db'

async function auditKelasMisterius() {
  console.log('Menjalankan audit kelas misterius (tanpa jadwal dan tanpa tipe_kelas)...\\n');

  const query = sql`
    SELECT
      k.id,
      k.tenant_id,
      k.nama,
      k.hari_pertemuan,
      k.jam_mulai,
      k.jam_selesai,
      k.created_at,
      COUNT(sk.id) AS jumlah_sesi_absensi
    FROM kelas k
    LEFT JOIN sesi_kelas sk ON sk.kelas_id = k.id
    WHERE k.hari_pertemuan = '{}'::hari[]
      AND k.jam_mulai IS NULL
      AND k.tipe_kelas IS NULL
    GROUP BY k.id, k.tenant_id, k.nama, k.hari_pertemuan,
             k.jam_mulai, k.jam_selesai, k.created_at
    ORDER BY k.tenant_id, k.created_at;
  `;

  const result = await db.execute(query);

  if (result.rows.length === 0) {
    console.log('✅ Tidak ditemukan kelas misterius. Semua kelas yang ada memiliki jadwal (online) atau telah diklasifikasikan.');
  } else {
    console.log(`⚠️ Ditemukan ${result.rows.length} kelas misterius yang tidak memiliki jadwal dan belum punya tipe_kelas.`);
    console.table(result.rows.map(r => ({
      id: r.id,
      nama: r.nama,
      tenant: r.tenant_id,
      jumlah_sesi: parseInt(r.jumlah_sesi_absensi, 10)
    })));
  }

  process.exit(0);
}

auditKelasMisterius();

// Script investigasi: cek setoran Jajang + notifikasi ustadz
// Jalankan dengan: npx tsx investigate-jajang.ts

import { config } from 'dotenv'
config()

import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './src/db/schema'
import { eq, and, ilike } from 'drizzle-orm'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const db = drizzle({ client: pool, schema })

async function main() {
  // ── A1. Cari santri bernama "Jajang" ────────────────────────────────
  console.log('\n=== A1. Cari santri bernama Jajang ===')
  const santriJajang = await db.select({
    id: schema.santri.id,
    nama: schema.santri.nama,
    kelasId: schema.santri.kelasId,
    tenantId: schema.santri.tenantId,
  })
    .from(schema.santri)
    .where(ilike(schema.santri.nama, '%jajang%'))

  console.log('Row santri:', JSON.stringify(santriJajang, null, 2))

  if (santriJajang.length === 0) {
    console.log('❌ Santri Jajang tidak ditemukan')
    process.exit(0)
  }

  const jajangId = santriJajang[0].id

  // ── A1. Setoran milik semua Jajang (5 terbaru per santri) ──
  console.log('\n=== A1. Setoran milik Jajang (5 terbaru per santri) ===')
  let allSetoran: any[] = []
  for (const j of santriJajang) {
    const setoranJajang = await db.select({
      id: schema.setoran.id,
      jenis: schema.setoran.jenis,
      ustadzId: schema.setoran.ustadzId,
      santriId: schema.setoran.santriId,
      tenantId: schema.setoran.tenantId,
      sumber: schema.setoran.sumber,
      createdAt: schema.setoran.createdAt,
      tanggalSetoran: schema.setoran.tanggalSetoran,
    })
      .from(schema.setoran)
      .where(eq(schema.setoran.santriId, j.id))
      .limit(5)
    console.log(`Santri ${j.nama} (${j.id}): ${setoranJajang.length} setoran`)
    if (setoranJajang.length) console.log(JSON.stringify(setoranJajang, null, 2))
    allSetoran = [...allSetoran, ...setoranJajang]
  }

  // ── A2. Cek apakah tabel notifikasi_ustadz ada di DB, dan isinya ───────
  console.log('\n=== A2. Cek tabel notifikasi_ustadz di database ===')
  const tableCheck = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('notifikasi_ustadz', 'notifikasi_santri')
    ORDER BY table_name
  `)
  console.log('Tabel notifikasi yang ADA di DB:', tableCheck.rows)

  if (tableCheck.rows.some((r: any) => r.table_name === 'notifikasi_ustadz')) {
    for (const s of allSetoran) {
      const notifs = await pool.query(
        `SELECT id, tipe, pesan, dibaca_pada, dibuat_pada FROM notifikasi_ustadz WHERE setoran_id = $1`,
        [s.id]
      )
      console.log(`setoranId=${s.id} jenis=${s.jenis} sumber=${s.sumber} => notifikasi_ustadz: ${notifs.rows.length} row(s)`)
      if (notifs.rows.length > 0) console.log('  detail:', JSON.stringify(notifs.rows, null, 2))
    }
  } else {
    console.log('❌ KONFIRMASI: tabel notifikasi_ustadz TIDAK ADA di database — migrasi belum dieksekusi')
  }

  // ── Cek kelas santri Jajang dan apakah ada ustadzId di kelas ────────
  console.log('\n=== Cek kelas semua Jajang ===')
  for (const j of santriJajang) {
    if (j.kelasId) {
      const kelasData = await db.select({
        id: schema.kelas.id,
        nama: schema.kelas.nama,
        ustadzId: schema.kelas.ustadzId,
      })
        .from(schema.kelas)
        .where(eq(schema.kelas.id, j.kelasId))
      console.log(`Santri ${j.nama}: kelas = `, JSON.stringify(kelasData, null, 2))
    } else {
      console.log(`⚠️  Santri ${j.nama}: kelasId = NULL — ini konfirmasi else-branch yang skip notifikasi`)
    }
  }

  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })

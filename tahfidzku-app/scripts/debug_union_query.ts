import 'dotenv/config'
import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function debug() {
  const tenantId = '40a1b66b-4e0e-49b8-b8bc-02b86c31a7c7' // example tenant id or query first tenant
  const [t] = await db.select().from(require('../src/db/schema').tenants).limit(1)
  console.log('Tenant:', t)

  const tid = t ? t.id : tenantId

  const unionQuery = sql`
    (
      SELECT s.id, s.santri_id as "santriId", 'tahfidz' as tipe, s.created_at as "createdAt", sa.nama as "santriNama",
        s.jenis, s.surah, s.juz, s.juz_mulai as "juzMulai", s.juz_selesai as "juzSelesai", s.lintas_juz as "lintasJuz",
        s.ayat_awal as "ayatAwal", s.ayat_akhir as "ayatAkhir", s.halaman_awal as "halamanAwal", s.halaman_akhir as "halamanAkhir",
        NULL as jilid, s.skor_kualitas as "skorKualitas", s.status_hafalan as "statusHafalan"
      FROM setoran s
      JOIN santri sa ON s.santri_id = sa.id
      WHERE s.tenant_id = ${tid}
      ORDER BY s.created_at DESC LIMIT 5
    )
    UNION ALL
    (
      SELECT si.id, si.santri_id as "santriId", 'iqra' as tipe, si.created_at as "createdAt", sa.nama as "santriNama",
        NULL as jenis, NULL as surah, NULL as juz, NULL as "juzMulai", NULL as "juzSelesai", false as "lintasJuz",
        NULL as "ayatAwal", NULL as "ayatAkhir", si.halaman_awal as "halamanAwal", si.halaman_akhir as "halamanAkhir",
        si.jilid as jilid, si.skor_kualitas as "skorKualitas", si.status_hafalan as "statusHafalan"
      FROM setoran_iqra si
      JOIN santri sa ON si.santri_id = sa.id
      WHERE si.tenant_id = ${tid}
      ORDER BY si.created_at DESC LIMIT 5
    )
    ORDER BY "createdAt" DESC LIMIT 5
  `

  const res = await db.execute(unionQuery)
  console.log('db.execute result keys:', Object.keys(res))
  console.log('res.rows:', (res as any).rows)
  process.exit(0)
}

debug().catch(err => {
  console.error('Debug error:', err)
  process.exit(1)
})

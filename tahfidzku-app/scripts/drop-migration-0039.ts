import 'dotenv/config'
import { db } from '../src/db'
import { sql } from 'drizzle-orm'

const indexesToDrop = [
  'idx_absensi_tenant_sesi',
  'idx_santri_tenant_kelas',
  'idx_setoran_tenant_tanggal',
  'idx_setoran_iqra_tenant_tanggal',
  'idx_ujian_tenant_santri',
  'idx_ujian_tenant_juz',
  'idx_ujian_iqra_tenant_santri',
  'idx_ujian_iqra_tenant_jilid',
]

async function main() {
  console.log('🔄 Temporarily dropping 8 indexes on LOCAL database for clean baseline testing...')
  for (const idx of indexesToDrop) {
    await db.execute(sql.raw(`DROP INDEX IF EXISTS "${idx}";`))
    console.log(`  - Dropped index ${idx}`)
  }
  console.log('✅ Local database is back to PRE-INDEX baseline state.')
  process.exit(0)
}

main()

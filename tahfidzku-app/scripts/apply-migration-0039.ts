import 'dotenv/config'
import { db } from '../src/db'
import { sql } from 'drizzle-orm'

const statements = [
  { name: 'Statement 1: idx_absensi_tenant_sesi', query: `CREATE INDEX IF NOT EXISTS "idx_absensi_tenant_sesi" ON "absensi" USING btree ("tenant_id","sesi_kelas_id");` },
  { name: 'Statement 2: idx_santri_tenant_kelas', query: `CREATE INDEX IF NOT EXISTS "idx_santri_tenant_kelas" ON "santri" USING btree ("tenant_id","kelas_id");` },
  { name: 'Statement 3: idx_setoran_tenant_tanggal', query: `CREATE INDEX IF NOT EXISTS "idx_setoran_tenant_tanggal" ON "setoran" USING btree ("tenant_id","tanggal_setoran");` },
  { name: 'Statement 4: idx_setoran_iqra_tenant_tanggal', query: `CREATE INDEX IF NOT EXISTS "idx_setoran_iqra_tenant_tanggal" ON "setoran_iqra" USING btree ("tenant_id","tanggal_setoran");` },
  { name: 'Statement 5: idx_ujian_tenant_santri', query: `CREATE INDEX IF NOT EXISTS "idx_ujian_tenant_santri" ON "ujian" USING btree ("tenant_id","santri_id");` },
  { name: 'Statement 6: idx_ujian_tenant_juz', query: `CREATE INDEX IF NOT EXISTS "idx_ujian_tenant_juz" ON "ujian" USING btree ("tenant_id","juz");` },
  { name: 'Statement 7: idx_ujian_iqra_tenant_santri', query: `CREATE INDEX IF NOT EXISTS "idx_ujian_iqra_tenant_santri" ON "ujian_iqra" USING btree ("tenant_id","santri_id");` },
  { name: 'Statement 8: idx_ujian_iqra_tenant_jilid', query: `CREATE INDEX IF NOT EXISTS "idx_ujian_iqra_tenant_jilid" ON "ujian_iqra" USING btree ("tenant_id","jilid_diuji");` },
]

async function main() {
  console.log('🚀 Executing migration 0039 on LOCAL database (Fail-Fast Mode)...')
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    try {
      await db.execute(sql.raw(stmt.query))
      console.log(`✅ [${i + 1}/${statements.length}] Succeeded: ${stmt.name}`)
    } catch (err: any) {
      console.error(`❌ [${i + 1}/${statements.length}] FAILED: ${stmt.name}`)
      console.error(`Error details:`, err.message || err)
      console.error(`⛔ Migration STOPPED immediately (Fail-Fast).`)
      process.exit(1)
    }
  }

  console.log('🎉 All 8 index creation statements executed successfully on LOCAL database!')
  process.exit(0)
}

main()

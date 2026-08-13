import dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'

// Load production environment
const envPath = path.resolve(process.cwd(), '.env.production')
const config = dotenv.config({ path: envPath }).parsed || {}
let dbUrl = config.DATABASE_URL || process.env.DATABASE_URL

if (dbUrl) dbUrl = dbUrl.replace(/^["']|["']$/g, '')

if (!dbUrl) {
  console.error('❌ ERROR: DATABASE_URL production tidak ditemukan di .env.production')
  process.exit(1)
}

const PROD_HOST = 'ep-twilight-feather-ao5fmi2r'
if (!dbUrl.includes(PROD_HOST)) {
  console.error(`❌ ERROR: DATABASE_URL tidak menunjuk ke PRODUCTION host (${PROD_HOST})`)
  process.exit(1)
}

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
  console.log('🚀 EXECUTING MIGRATION 0039 ON PRODUCTION DATABASE...')
  console.log(`Target Host: ${PROD_HOST}\n`)

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    try {
      await client.query(stmt.query)
      console.log(`✅ [${i + 1}/${statements.length}] Succeeded: ${stmt.name}`)
    } catch (err: any) {
      console.error(`❌ [${i + 1}/${statements.length}] FAILED: ${stmt.name}`)
      console.error(`Error details:`, err.message || err)
      console.error(`⛔ Migration STOPPED immediately (Fail-Fast).`)
      await client.end()
      process.exit(1)
    }
  }

  await client.end()
  console.log('\n🎉 ALL 8 MIGRATION STATEMENTS EXECUTED SUCCESSFULLY ON PRODUCTION DATABASE!')
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

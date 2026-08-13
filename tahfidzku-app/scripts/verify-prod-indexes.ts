import dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'

const envPath = path.resolve(process.cwd(), '.env.production')
const config = dotenv.config({ path: envPath }).parsed || {}
let dbUrl = config.DATABASE_URL || process.env.DATABASE_URL

if (dbUrl) dbUrl = dbUrl.replace(/^["']|["']$/g, '')

const targetIndexes = [
  'idx_absensi_tenant_sesi',
  'idx_santri_tenant_kelas',
  'idx_setoran_tenant_tanggal',
  'idx_setoran_iqra_tenant_tanggal',
  'idx_ujian_tenant_santri',
  'idx_ujian_tenant_juz',
  'idx_ujian_iqra_tenant_santri',
  'idx_ujian_iqra_tenant_jilid',
]

async function verify() {
  console.log('🔍 VERIFYING INDEXES ON PRODUCTION DATABASE (pg_indexes)...')
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const query = `
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE indexname = ANY($1)
    ORDER BY tablename, indexname;
  `

  const res = await client.query(query, [targetIndexes])
  console.log(`\nFound ${res.rows.length} / ${targetIndexes.length} target indexes on Production database:`)
  console.table(res.rows)

  await client.end()

  if (res.rows.length === targetIndexes.length) {
    console.log('\n✅ ALL 8 INDEXES ARE CONFIRMED ACTIVE ON PRODUCTION DATABASE!')
    process.exit(0)
  } else {
    console.error('\n❌ MISSING INDEXES ON PRODUCTION!')
    process.exit(1)
  }
}

verify().catch(err => {
  console.error(err)
  process.exit(1)
})

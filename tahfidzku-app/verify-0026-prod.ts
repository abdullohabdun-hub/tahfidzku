import { neon } from '@neondatabase/serverless'

const connectionString = "postgresql://neondb_owner:npg_IzDm0nhYXb3O@ep-misty-tree-aoegy4tj-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
const sql = neon(connectionString)

async function main() {
  const step = process.argv[2]
  
  if (step === 'pre') {
    console.log('=== PRE-MIGRATION HASH CHECK ===')
    try {
      const rows = await sql`
        SELECT id, hash, created_at 
        FROM drizzle.__drizzle_migrations 
        ORDER BY id DESC LIMIT 5
      `
      console.table(rows)
    } catch (e) {
      console.error(e)
    }
  } else if (step === 'post') {
    console.log('\n=== POST-MIGRATION HASH CHECK ===')
    try {
      const rows = await sql`
        SELECT id, hash, created_at 
        FROM drizzle.__drizzle_migrations 
        ORDER BY id DESC LIMIT 3
      `
      console.table(rows)
      
      console.log('\n=== CHECK TABLE ===')
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'notifikasi_gagal_log'
      `
      if (tableCheck.length > 0) {
        console.log('✅ Tabel notifikasi_gagal_log DITEMUKAN.')
      } else {
        console.log('❌ Tabel notifikasi_gagal_log TIDAK DITEMUKAN.')
      }
    } catch (e) {
      console.error(e)
    }
  }
}

main().catch(console.error)

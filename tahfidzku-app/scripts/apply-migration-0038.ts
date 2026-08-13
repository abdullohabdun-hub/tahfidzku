import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('Running migration statement...')
  try {
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_setoran_santri_jenis_created" ON "setoran" USING btree ("santri_id","jenis","created_at");`)
    console.log('✅ Statement 1 succeeded: Index idx_setoran_santri_jenis_created created.')
  } catch (err: any) {
    console.error('❌ Statement 1 failed:', err.message)
    process.exit(1)
  }
}

main()

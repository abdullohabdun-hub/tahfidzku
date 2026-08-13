import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function diag() {
  try {
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_absensi_tenant_sesi" ON "absensi" USING btree ("tenant_id","sesi_kelas_id");`)
    console.log('Success')
  } catch (err: any) {
    console.error('Error detail:', err)
  }
  process.exit(0)
}
diag()

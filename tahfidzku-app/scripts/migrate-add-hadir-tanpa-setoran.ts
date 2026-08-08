import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('⏳ Mengecek ENUM status_absensi di database...')
  try {
    const checkEnum = await db.execute(sql`
      SELECT enumlabel FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'status_absensi' AND enumlabel = 'hadir_tanpa_setoran'
    `)
    
    if (checkEnum.rows.length === 0) {
      console.log('⚙️ Menjalankan ALTER TYPE untuk menambahkan "hadir_tanpa_setoran"...')
      await db.execute(sql`ALTER TYPE status_absensi ADD VALUE 'hadir_tanpa_setoran'`)
      console.log('✅ Berhasil menambahkan hadir_tanpa_setoran ke status_absensi!')
    } else {
      console.log('✅ Enum hadir_tanpa_setoran sudah ada di database, skip.')
    }
  } catch (err) {
    console.error('❌ Gagal mengubah enum:', err)
  }
  process.exit(0)
}

main()

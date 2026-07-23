import 'dotenv/config'
import { db } from './index'
import { tenants } from './schema'
import { eq } from 'drizzle-orm'

async function update() {
  console.log('Mengupdate status tenant...')
  try {
    const updated = await db.update(tenants)
      .set({ status: 'aktif' })
      .where(eq(tenants.slug, 'tahfidzonlinetsl'))
      .returning()
    console.log('✅ Status berhasil diupdate:', updated[0]?.status)
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal mengupdate:', err)
    process.exit(1)
  }
}

update()

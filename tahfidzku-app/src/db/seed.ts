import 'dotenv/config'
import { db } from './index'
import { tenants, users } from './schema'

async function seed() {
  console.log('Menjalankan seeder data...')

  try {
    // 1. Buat Lembaga (Tenant) Dummy
    const [tenant] = await db.insert(tenants).values({
      namaLembaga: 'Pesantren TahfidzKu Demo',
      slug: 'demo',
    }).returning()
    console.log('✅ Tenant berhasil dibuat:', tenant.namaLembaga)

    // 2. Buat Akun Ustadz Dummy
    const [ustadz] = await db.insert(users).values({
      tenantId: tenant.id,
      nama: 'Ustadz Ahmad (Demo)',
      email: 'ustadz@demo.com',
      passwordHash: '123456', // PIN statis sederhana sesuai kesepakatan MVP
      role: 'ustadz',
    }).returning()
    console.log('✅ Akun Ustadz berhasil dibuat:', ustadz.email)

    // 3. Buat Akun Admin Dummy
    const [admin] = await db.insert(users).values({
      tenantId: tenant.id,
      nama: 'Admin Demo',
      email: 'admin@demo.com',
      passwordHash: '123456',
      role: 'admin',
    }).returning()
    console.log('✅ Akun Admin berhasil dibuat:', admin.email)

    console.log('🎉 Seeding selesai!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal melakukan seeding:', err)
    process.exit(1)
  }
}

seed()

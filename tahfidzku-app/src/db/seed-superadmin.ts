import 'dotenv/config'
import { db } from './index'
import { tenants, users } from './schema'

async function seed() {
  console.log('Menjalankan seeder superadmin...')

  try {
    // 1. Buat Lembaga (Tenant) tahfidzonlinetsl
    const [tenant] = await db.insert(tenants).values({
      namaLembaga: 'Tahfidz Online TSL',
      slug: 'tahfidzonlinetsl',
    }).returning()
    console.log('✅ Tenant berhasil dibuat:', tenant.slug)

    // 2. Buat Akun Admin
    const [admin] = await db.insert(users).values({
      tenantId: tenant.id,
      nama: 'Super Admin',
      email: 'superadmin@tahfidzku.com',
      username: 'superadmin',
      passwordHash: '123456',
      role: 'admin',
    }).returning()
    console.log('✅ Akun Admin berhasil dibuat. Username:', admin.username)

    console.log('🎉 Seeding selesai!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal melakukan seeding:', err)
    process.exit(1)
  }
}

seed()

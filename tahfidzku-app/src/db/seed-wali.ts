import 'dotenv/config'
import { db } from './index'
import { tenants, users, santri, waliSantri } from './schema'
import { eq, and } from 'drizzle-orm'

async function seedWali() {
  console.log('Memulai seeder Wali Santri...')
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, 'tahfidzonlinetsl'))
    
    // Ambil santri reguler yang belum punya wali
    const santriRegulers = await db.select().from(santri).where(and(
      eq(santri.tenantId, tenant.id),
      eq(santri.tipe, 'reguler')
    ))

    let created = 0;
    for (const [index, s] of santriRegulers.entries()) {
      // 1. Buat Akun User Wali
      const [waliUser] = await db.insert(users).values({
        tenantId: tenant.id,
        nama: `Wali dari ${s.nama}`,
        username: `walireguler${index + 1}`,
        passwordHash: '123456',
        role: 'wali' as const,
      }).returning()

      // 2. Hubungkan Wali dengan Santri di tabel wali_santri
      await db.insert(waliSantri).values({
        tenantId: tenant.id,
        waliUserId: waliUser.id,
        santriId: s.id
      })
      created++
    }

    console.log(`✅ ${created} Akun Wali Santri Reguler berhasil dibuat! (Username: walireguler1 - walireguler20, Password: 123456)`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal melakukan seeding Wali:', err)
    process.exit(1)
  }
}

seedWali()

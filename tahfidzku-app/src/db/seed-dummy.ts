import 'dotenv/config'
import { db } from './index'
import { tenants, users, kelas, santri } from './schema'
import { eq } from 'drizzle-orm'

async function seedDummy() {
  console.log('Memulai seeder dummy data...')
  
  try {
    // 1. Ambil tenant tahfidzonlinetsl
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, 'tahfidzonlinetsl'))
    if (!tenant) {
      throw new Error('Tenant tahfidzonlinetsl tidak ditemukan!')
    }

    // 2. Buat 5 Ustadz
    const ustadzToInsert = Array.from({ length: 5 }).map((_, i) => ({
      tenantId: tenant.id,
      nama: `Ustadz ${i + 1}`,
      username: `ustadz${i + 1}`,
      passwordHash: '123456',
      role: 'ustadz' as const,
    }))
    const insertedUstadz = await db.insert(users).values(ustadzToInsert).returning()
    console.log(`✅ ${insertedUstadz.length} Ustadz berhasil dibuat.`)

    // 3. Buat 5 Kelas (Halaqoh)
    const kelasToInsert = insertedUstadz.map((ust, i) => ({
      tenantId: tenant.id,
      nama: `Halaqoh ${i + 1}`,
      ustadzId: ust.id,
    }))
    const insertedKelas = await db.insert(kelas).values(kelasToInsert).returning()
    console.log(`✅ ${insertedKelas.length} Kelas berhasil dibuat.`)

    // 4. Buat 40 Santri Dewasa & 20 Santri Reguler
    const santriDewasa = Array.from({ length: 40 }).map((_, i) => ({
      tenantId: tenant.id,
      nama: `Santri Dewasa ${i + 1}`,
      tipe: 'dewasa' as const,
      kelasId: insertedKelas[i % insertedKelas.length].id, // Distribusi merata ke 5 kelas
    }))

    const santriReguler = Array.from({ length: 20 }).map((_, i) => ({
      tenantId: tenant.id,
      nama: `Santri Reguler ${i + 1}`,
      tipe: 'reguler' as const,
      kelasId: insertedKelas[i % insertedKelas.length].id,
    }))

    const allSantri = [...santriDewasa, ...santriReguler]
    const insertedSantri = await db.insert(santri).values(allSantri).returning()
    console.log(`✅ ${insertedSantri.length} Santri berhasil dibuat (40 Dewasa, 20 Reguler).`)

    // 5. Buat Akun Users untuk Santri
    const santriUsersToInsert = insertedSantri.map((s, i) => ({
      tenantId: tenant.id,
      nama: s.nama,
      username: `santri${i + 1}`,
      passwordHash: '123456',
      role: 'santri' as const,
      santriId: s.id,
    }))
    await db.insert(users).values(santriUsersToInsert)
    console.log(`✅ Akun login untuk santri berhasil dibuat. (Username: santri1 - santri60, Password: 123456)`)

    console.log('🎉 Seeding dummy data selesai!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal melakukan seeding:', err)
    process.exit(1)
  }
}

seedDummy()

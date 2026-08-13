import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function seedTestIqra() {
  console.log('🌱 SEEDING TEST IQRA DATA FOR VERIFICATION...')

  const { db } = await import('../src/db/index')
  const { santri, ujianIqra, tenants, users } = await import('../src/db/schema/index')
  const { eq } = await import('drizzle-orm')

  const [tenant] = await db.select().from(tenants).limit(1)
  const [ustadz] = await db.select().from(users).where(eq(users.role, 'ustadz')).limit(1)
  const allSantri = await db.select().from(santri).where(eq(santri.tenantId, tenant.id)).limit(5)

  if (allSantri.length < 3) {
    console.error('Not enough santri in local DB')
    process.exit(1)
  }

  // Set pending Iqra for 3 santri
  const s1 = allSantri[0]
  const s2 = allSantri[1]
  const s3 = allSantri[2]

  await db.update(santri).set({ jilidIqraUjianPending: 2 }).where(eq(santri.id, s1.id))
  await db.update(santri).set({ jilidIqraUjianPending: 3 }).where(eq(santri.id, s2.id))
  await db.update(santri).set({ jilidIqraUjianPending: 1 }).where(eq(santri.id, s3.id))

  // Insert mock ujian_iqra records
  // Santri 1: 2 attempts, both failed (lulus = false) -> gagalCount: 2
  await db.insert(ujianIqra).values([
    { tenantId: tenant.id, santriId: s1.id, jilidDiuji: 2, lulus: false, ujiOlehUstadzId: ustadz.id, attempt: 1 },
    { tenantId: tenant.id, santriId: s1.id, jilidDiuji: 2, lulus: false, ujiOlehUstadzId: ustadz.id, attempt: 2 },
  ])

  // Santri 2: 3 attempts, all failed (lulus = false) -> gagalCount: 3, warningGagal: true
  await db.insert(ujianIqra).values([
    { tenantId: tenant.id, santriId: s2.id, jilidDiuji: 3, lulus: false, ujiOlehUstadzId: ustadz.id, attempt: 1 },
    { tenantId: tenant.id, santriId: s2.id, jilidDiuji: 3, lulus: false, ujiOlehUstadzId: ustadz.id, attempt: 2 },
    { tenantId: tenant.id, santriId: s2.id, jilidDiuji: 3, lulus: false, ujiOlehUstadzId: ustadz.id, attempt: 3 },
  ])

  // Santri 3: 1 attempt passed (lulus = true), 1 failed (lulus = false) -> gagalCount: 1
  await db.insert(ujianIqra).values([
    { tenantId: tenant.id, santriId: s3.id, jilidDiuji: 1, lulus: true, ujiOlehUstadzId: ustadz.id, attempt: 1 },
    { tenantId: tenant.id, santriId: s3.id, jilidDiuji: 1, lulus: false, ujiOlehUstadzId: ustadz.id, attempt: 2 },
  ])

  console.log('✅ Test Iqra data successfully seeded!')
  process.exit(0)
}

seedTestIqra().catch(err => {
  console.error(err)
  process.exit(1)
})

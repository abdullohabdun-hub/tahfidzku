import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function seed50Santri() {
  console.log('🌱 SEEDING 50 DUMMY SANTRI FOR PAGINATION BENCHMARK...')

  const { db } = await import('../src/db/index')
  const { santri, tenants, kelas } = await import('../src/db/schema/index')
  const { eq } = await import('drizzle-orm')

  const [tenant] = await db.select().from(tenants).limit(1)
  const [kelasTarget] = await db.select().from(kelas).where(eq(kelas.tenantId, tenant.id)).limit(1)

  if (!tenant) {
    console.error('No tenant found')
    process.exit(1)
  }

  // Count existing dummy benchmark santri
  const existing = await db.select().from(santri).where(eq(santri.tenantId, tenant.id))
  console.log(`Current santri count: ${existing.length}`)

  const needed = 50 - existing.length
  if (needed <= 0) {
    console.log(`Already have ${existing.length} santri (>= 50). No seeding needed.`)
    process.exit(0)
  }

  console.log(`Inserting ${needed} dummy santri records...`)
  const newSantriList = []
  for (let i = 1; i <= needed; i++) {
    newSantriList.push({
      tenantId: tenant.id,
      nama: `Santri Benchmark ${existing.length + i}`,
      tipe: (i % 2 === 0 ? 'reguler' : 'dewasa') as 'reguler' | 'dewasa',
      tahapSantri: 'tahfidz' as 'tahfidz',
      targetJuz: 30,
      kelasId: kelasTarget ? kelasTarget.id : null,
    })
  }

  await db.insert(santri).values(newSantriList)
  
  const updatedCount = await db.select().from(santri).where(eq(santri.tenantId, tenant.id))
  console.log(`✅ Seeding complete! Total santri in database now: ${updatedCount.length}`)
  process.exit(0)
}

seed50Santri().catch(err => {
  console.error(err)
  process.exit(1)
})

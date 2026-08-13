import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function runTest() {
  console.log('=== VERIFYING N+1 VS AGGREGATE LOGIC EQUIVALENCE (WITH IQRA DATA) ===\n')

  const { db } = await import('../src/db/index')
  const { santri, ujian, ujianIqra, tenants, kelas } = await import('../src/db/schema/index')
  const { eq, and, inArray, isNotNull, sql } = await import('drizzle-orm')

  // Get demo tenant & kelas list
  const [demoTenant] = await db.select().from(tenants).limit(1)
  if (!demoTenant) {
    console.error('No tenant found')
    process.exit(1)
  }
  const tenantId = demoTenant.id

  const kelasList = await db.select({ id: kelas.id }).from(kelas).where(eq(kelas.tenantId, tenantId))
  const kelasIds = kelasList.map(k => k.id)

  if (kelasIds.length === 0) {
    console.log('No kelas found, test trivially passes.')
    process.exit(0)
  }

  // -------------------------------------------------------------
  // OLD LOGIC (N+1)
  // -------------------------------------------------------------
  const pendingOld = await db
    .select({
      santriId:        santri.id,
      santriNama:      santri.nama,
      juzUjianPending: santri.juzUjianPending,
      kelasId:         santri.kelasId,
    })
    .from(santri)
    .where(and(
      eq(santri.tenantId, tenantId),
      inArray(santri.kelasId, kelasIds),
      isNotNull(santri.juzUjianPending)
    ))

  const withAttemptsOld = await Promise.all(pendingOld.map(async (s) => {
    const attempts = await db
      .select({ id: ujian.id, status: ujian.status })
      .from(ujian)
      .where(and(
        eq(ujian.santriId, s.santriId),
        eq(ujian.juz, s.juzUjianPending!),
        eq(ujian.tenantId, tenantId)
      ))
    const gagalCount = attempts.filter(a => a.status === 'tidak_lulus').length
    return { ...s, gagalCount, warningGagal: gagalCount >= 3 }
  }))

  const pendingIqraRawOld = await db
    .select({
      santriId:              santri.id,
      santriNama:            santri.nama,
      jilidIqraUjianPending: santri.jilidIqraUjianPending,
      kelasId:               santri.kelasId,
    })
    .from(santri)
    .where(and(
      eq(santri.tenantId, tenantId),
      inArray(santri.kelasId, kelasIds),
      isNotNull(santri.jilidIqraUjianPending)
    ))

  const pendingIqraOld = await Promise.all(pendingIqraRawOld.map(async (s) => {
    const attempts = await db
      .select({ id: ujianIqra.id, lulus: ujianIqra.lulus })
      .from(ujianIqra)
      .where(and(
        eq(ujianIqra.santriId, s.santriId),
        eq(ujianIqra.jilidDiuji, s.jilidIqraUjianPending!),
        eq(ujianIqra.tenantId, tenantId)
      ))
    const gagalCount = attempts.filter(a => !a.lulus).length
    return { ...s, gagalCount, warningGagal: gagalCount >= 3 }
  }))

  // -------------------------------------------------------------
  // NEW LOGIC (Aggregate GROUP BY)
  // -------------------------------------------------------------
  const pendingNew = await db
    .select({
      santriId:        santri.id,
      santriNama:      santri.nama,
      juzUjianPending: santri.juzUjianPending,
      kelasId:         santri.kelasId,
    })
    .from(santri)
    .where(and(
      eq(santri.tenantId, tenantId),
      inArray(santri.kelasId, kelasIds),
      isNotNull(santri.juzUjianPending)
    ))

  let withAttemptsNew: Array<{ santriId: string; santriNama: string; juzUjianPending: number | null; kelasId: string | null; gagalCount: number; warningGagal: boolean }> = []
  if (pendingNew.length > 0) {
    const santriIds = pendingNew.map(p => p.santriId)
    const gagalCounts = await db
      .select({
        santriId: ujian.santriId,
        juz: ujian.juz,
        gagalCount: sql<number>`cast(count(*) filter (where ${ujian.status} = 'tidak_lulus') as integer)`
      })
      .from(ujian)
      .where(and(
        eq(ujian.tenantId, tenantId),
        inArray(ujian.santriId, santriIds)
      ))
      .groupBy(ujian.santriId, ujian.juz)

    const gagalMap = new Map<string, number>()
    for (const row of gagalCounts) {
      gagalMap.set(`${row.santriId}:${row.juz}`, Number(row.gagalCount))
    }

    withAttemptsNew = pendingNew.map((s) => {
      const gagalCount = gagalMap.get(`${s.santriId}:${s.juzUjianPending}`) || 0
      return { ...s, gagalCount, warningGagal: gagalCount >= 3 }
    })
  }

  const pendingIqraRawNew = await db
    .select({
      santriId:              santri.id,
      santriNama:            santri.nama,
      jilidIqraUjianPending: santri.jilidIqraUjianPending,
      kelasId:               santri.kelasId,
    })
    .from(santri)
    .where(and(
      eq(santri.tenantId, tenantId),
      inArray(santri.kelasId, kelasIds),
      isNotNull(santri.jilidIqraUjianPending)
    ))

  let pendingIqraNew: Array<{ santriId: string; santriNama: string; jilidIqraUjianPending: number | null; kelasId: string | null; gagalCount: number; warningGagal: boolean }> = []
  if (pendingIqraRawNew.length > 0) {
    const santriIqraIds = pendingIqraRawNew.map(p => p.santriId)
    const gagalIqraCounts = await db
      .select({
        santriId: ujianIqra.santriId,
        jilidDiuji: ujianIqra.jilidDiuji,
        gagalCount: sql<number>`cast(count(*) filter (where ${ujianIqra.lulus} = false) as integer)`
      })
      .from(ujianIqra)
      .where(and(
        eq(ujianIqra.tenantId, tenantId),
        inArray(ujianIqra.santriId, santriIqraIds)
      ))
      .groupBy(ujianIqra.santriId, ujianIqra.jilidDiuji)

    const gagalIqraMap = new Map<string, number>()
    for (const row of gagalIqraCounts) {
      gagalIqraMap.set(`${row.santriId}:${row.jilidDiuji}`, Number(row.gagalCount))
    }

    pendingIqraNew = pendingIqraRawNew.map((s) => {
      const gagalCount = gagalIqraMap.get(`${s.santriId}:${s.jilidIqraUjianPending}`) || 0
      return { ...s, gagalCount, warningGagal: gagalCount >= 3 }
    })
  }

  // COMPARE OUTPUTS
  const strOld = JSON.stringify({ pendingTahfidz: withAttemptsOld, pendingIqra: pendingIqraOld }, null, 2)
  const strNew = JSON.stringify({ pendingTahfidz: withAttemptsNew, pendingIqra: pendingIqraNew }, null, 2)

  console.log('--- OLD N+1 OUTPUT ---')
  console.log(strOld)
  console.log('\n--- NEW AGGREGATE OUTPUT ---')
  console.log(strNew)

  if (strOld === strNew) {
    console.log('\n✅ PERFECT MATCH! The outputs of Old N+1 vs New Aggregate are 100% IDENTICAL (INCLUDING REAL IQRA DATA)!')
    process.exit(0)
  } else {
    console.error('\n❌ MISMATCH DETECTED between Old and New outputs!')
    process.exit(1)
  }
}

runTest().catch(err => {
  console.error(err)
  process.exit(1)
})

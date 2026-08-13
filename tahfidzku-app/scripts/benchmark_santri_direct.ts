import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function runDirectBenchmark() {
  console.log('=== MULTI-RUN DIRECT SERVER FUNCTION BENCHMARK ===\n')

  const { db } = await import('../src/db/index')
  const { santri, tenants } = await import('../src/db/schema/index')
  const { eq, desc, sql } = await import('drizzle-orm')

  const [tenant] = await db.select().from(tenants).limit(1)
  const tenantId = tenant.id

  const totalSantri = await db.select().from(santri).where(eq(santri.tenantId, tenantId))
  console.log(`📊 TOTAL SANTRI IN DATABASE: ${totalSantri.length} rows\n`)

  const runs: Record<string, { run1Ms: number; run2Ms: number; avgMs: number }> = {}

  // Helper function to measure a function with 2 explicit runs
  async function measureScenario(name: string, fn: () => Promise<number>) {
    console.log(`Executing ${name}...`)
    const run1Ms = await fn()
    const run2Ms = await fn()
    const avgMs = Number(((run1Ms + run2Ms) / 2).toFixed(2))
    runs[name] = { run1Ms, run2Ms, avgMs }
    console.log(`   - Run 1: ${run1Ms} ms`)
    console.log(`   - Run 2: ${run2Ms} ms`)
    console.log(`   - Average: ${avgMs} ms\n`)
  }

  // 1. FETCH ALL (NO PAGINATION)
  await measureScenario('Fetch All (69 santri)', async () => {
    const t0 = performance.now()
    await db.query.santri.findMany({
      where: eq(santri.tenantId, tenantId),
      orderBy: [desc(santri.createdAt)],
      with: {
        kelas: { columns: { nama: true } },
        akun: { columns: { email: true, noWa: true, role: true, nama: true } },
        daftarWali: {
          with: {
            wali: { columns: { nama: true, email: true, noWa: true } }
          }
        }
      }
    })
    const t1 = performance.now()
    return Number((t1 - t0).toFixed(2))
  })

  // 2. PAGINATED PAGE 1 (20 SANTRI + COUNT QUERY)
  await measureScenario('Paginated Page 1 (20 santri + count)', async () => {
    const t0 = performance.now()
    await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(santri)
      .where(eq(santri.tenantId, tenantId))

    await db.query.santri.findMany({
      where: eq(santri.tenantId, tenantId),
      orderBy: [desc(santri.createdAt)],
      limit: 20,
      offset: 0,
      with: {
        kelas: { columns: { nama: true } },
        akun: { columns: { email: true, noWa: true, role: true, nama: true } },
        daftarWali: {
          with: {
            wali: { columns: { nama: true, email: true, noWa: true } }
          }
        }
      }
    })
    const t1 = performance.now()
    return Number((t1 - t0).toFixed(2))
  })

  // 3. PAGINATED PAGE 2 (20 SANTRI OFFSET 20)
  await measureScenario('Paginated Page 2 (20 santri offset 20)', async () => {
    const t0 = performance.now()
    await db.query.santri.findMany({
      where: eq(santri.tenantId, tenantId),
      orderBy: [desc(santri.createdAt)],
      limit: 20,
      offset: 20,
      with: {
        kelas: { columns: { nama: true } },
        akun: { columns: { email: true, noWa: true, role: true, nama: true } },
        daftarWali: {
          with: {
            wali: { columns: { nama: true, email: true, noWa: true } }
          }
        }
      }
    })
    const t1 = performance.now()
    return Number((t1 - t0).toFixed(2))
  })

  console.log('=== RAW JSON RESULT FOR REPORTING ===')
  console.log(JSON.stringify({ totalSantriInDb: totalSantri.length, results: runs }, null, 2))

  process.exit(0)
}

runDirectBenchmark().catch(err => {
  console.error(err)
  process.exit(1)
})

import 'dotenv/config'
import { db } from '../src/db'
import { sql } from 'drizzle-orm'
import { getLegacyMingguMulaiKey } from '../src/lib/dateUtils'

async function main() {
  // Ambil sembarang santri yang ada datanya
  const setoran = await db.execute(sql`SELECT santri_id, tenant_id FROM setoran LIMIT 1`)
  
  if (setoran.rows.length === 0) {
    console.log("Belum ada data setoran sama sekali.")
    process.exit(0)
  }
  
  const { santri_id, tenant_id } = setoran.rows[0] as any

  console.log(`Menggunakan santri: ${santri_id} (tenant: ${tenant_id})`)

  const grafikHarianResult = await db.execute(sql`
    SELECT 
      DATE(created_at AT TIME ZONE 'Asia/Jakarta') as tanggal,
      jenis,
      SUM(COALESCE(halaman_akhir - halaman_awal + 1, 0)) as total_halaman,
      COUNT(id) as total_setoran
    FROM setoran
    WHERE santri_id = ${santri_id} AND tenant_id = ${tenant_id}
      AND (created_at AT TIME ZONE 'Asia/Jakarta') >= (NOW() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '14 days'
    GROUP BY DATE(created_at AT TIME ZONE 'Asia/Jakarta'), jenis
    ORDER BY DATE(created_at AT TIME ZONE 'Asia/Jakarta') ASC
  `)

  console.log("\nHASIL MENTAH DARI DB:")
  for (const row of grafikHarianResult.rows) {
    const tanggalVal = (row as any).tanggal
    console.log(`- tanggal:`, typeof tanggalVal === 'object' && tanggalVal instanceof Date ? `[Date] ${tanggalVal.toISOString()}` : `[${typeof tanggalVal}] ${tanggalVal}`, `| jenis: ${(row as any).jenis}`)
  }

  // Simulasi mapping yang terjadi di server-fn
  const grafikHarian = grafikHarianResult.rows.map((row: any) => ({
    tanggal: row.tanggal instanceof Date ? row.tanggal.toISOString() : String(row.tanggal), // JSON.stringify behavior
    jenis: row.jenis,
    totalHalaman: Number(row.total_halaman),
    totalSetoran: Number(row.total_setoran)
  }))

  console.log("\nHASIL SETELAH DI-SERIALIZE KE CLIENT:")
  console.log(JSON.stringify(grafikHarian, null, 2))

  process.exit(0)
}

main().catch(console.error)

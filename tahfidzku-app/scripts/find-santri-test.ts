import { db } from '../src/db'
import { santri, users, setoran } from '../src/db/schema'
import { eq, isNotNull } from 'drizzle-orm'

async function main() {
  const santriWithPosisi = await db.select({
    id: santri.id,
    nama: santri.nama,
    posisiTerakhir: santri.posisiTerakhir,
    kelasId: santri.kelasId,
    tenantId: santri.tenantId,
  }).from(santri).where(isNotNull(santri.posisiTerakhir)).limit(5)

  console.log('Santri with posisiTerakhir:', JSON.stringify(santriWithPosisi, null, 2))
}

main()

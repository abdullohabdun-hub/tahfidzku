import 'dotenv/config'
import { db } from '../src/db'
import { santri } from '../src/db/schema'
import { sql } from 'drizzle-orm'

async function main() {
  const badRecords = await db.select({
    id: santri.id,
    nama: santri.nama,
    posisiTerakhir: santri.posisiTerakhir
  }).from(santri).where(
    sql`${santri.posisiTerakhir}->>'surahNomor' = '1' AND (${santri.posisiTerakhir}->>'ayat')::int > 7`
  )

  console.log('Bad records found:', badRecords)
  process.exit(0)
}

main().catch(console.error)

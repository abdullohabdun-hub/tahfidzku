import 'dotenv/config'
import { db } from '../src/db'
import { santri } from '../src/db/schema'
import { cariJuzUntukAyat } from '../src/lib/quranMapper'
import { sql } from 'drizzle-orm'

async function checkAll() {
  const allRecords = await db.select({
    id: santri.id,
    nama: santri.nama,
    posisiTerakhir: santri.posisiTerakhir
  }).from(santri).where(sql`${santri.posisiTerakhir} IS NOT NULL`)

  const badRecords = []
  
  for (const record of allRecords) {
    if (record.posisiTerakhir) {
      try {
        cariJuzUntukAyat(
          (record.posisiTerakhir as any).surahNomor, 
          (record.posisiTerakhir as any).ayat
        )
      } catch (err: any) {
        badRecords.push({
          id: record.id,
          nama: record.nama,
          posisiTerakhir: record.posisiTerakhir,
          error: err.message
        })
      }
    }
  }

  console.log('Total bad records across all surahs:', badRecords.length)
  if (badRecords.length > 0) {
    console.log(JSON.stringify(badRecords, null, 2))
  }
  process.exit(0)
}

checkAll().catch(console.error)

import 'dotenv/config'
import { db } from '../src/db'
import { santri } from '../src/db/schema'
import { sql, eq } from 'drizzle-orm'

async function fix() {
  const badRecords = await db.select({
    id: santri.id
  }).from(santri).where(
    sql`${santri.posisiTerakhir}->>'surahNomor' = '1' AND (${santri.posisiTerakhir}->>'ayat')::int > 7`
  )

  if (badRecords.length > 0) {
    for (const record of badRecords) {
      await db.update(santri)
        .set({ posisiTerakhir: null })
        .where(eq(santri.id, record.id))
      console.log(`Nullified posisiTerakhir for santri ID: ${record.id}`)
    }
  } else {
    console.log('No bad records found.')
  }
  process.exit(0)
}

fix().catch(console.error)

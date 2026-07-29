import 'dotenv/config'
import { db } from '../src/db'
import { santri } from '../src/db/schema'
import { eq } from 'drizzle-orm'
db.select({
  nama: santri.nama,
  posisiTerakhir: santri.posisiTerakhir,
  batasHafalanJuz: santri.batasHafalanJuz,
  batasHafalanSurah: santri.batasHafalanSurah,
  batasHafalanAyat: santri.batasHafalanAyat,
  urutanHafalan: santri.urutanHafalan,
}).from(santri).where(eq(santri.nama, 'adam alis'))
  .then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(0) })

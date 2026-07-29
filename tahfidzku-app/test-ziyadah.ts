import { config } from 'dotenv'
config()
import { db } from './src/db/index'
import { santri, setoran } from './src/db/schema/index'
import { eq } from 'drizzle-orm'
import { cariJuzUntukAyat, getAyatTerakhirJuz } from './src/lib/quranMapper'

async function run() {
  const payload = {
    santriId: "b8a8b1ee-8e6e-44db-b869-7c4be51e9e80", // Needs valid UUID
    jenis: "ziyadah" as const,
    kualitas: "lancar" as const,
    juz: 30,
    surahNomor: 78,
    ayatAwal: 1,
    ayatAkhir: 5,
    surah: "An-Naba",
  }
  
  try {
    console.log("Running transaction...")
    
    const tenantId = "test-tenant"
    const ustadzId = "test-ustadz"

    const result = await db.transaction(async (tx) => {
      // 1. Insert setoran
      const [newSetoran] = await tx
        .insert(setoran)
        .values({
          tenantId,
          santriId: payload.santriId,
          ustadzId: ustadzId,
          jenis: payload.jenis,
          juz: payload.juz,
          kualitas: payload.kualitas,
          surah: payload.surah,
          ayatAwal: payload.ayatAwal,
          ayatAkhir: payload.ayatAkhir,
          tanggalSetoran: '2026-07-29',
          isBackdated: false,
        })
        .returning()

      // 2. Update tracker posisiTerakhir jika Ziyadah
      if (payload.jenis === 'ziyadah' && payload.surahNomor && payload.ayatAkhir) {
        const currentSantri = await tx.select({ juzProgress: santri.juzProgress }).from(santri).where(eq(santri.id, payload.santriId)).limit(1)
        let newJuzProgress = currentSantri[0]?.juzProgress || []

        const juzSekarang = cariJuzUntukAyat(payload.surahNomor, payload.ayatAkhir)
        const akhirJuz = getAyatTerakhirJuz(juzSekarang)
        
        if (payload.surahNomor === akhirJuz.surahNomor && payload.ayatAkhir === akhirJuz.ayat) {
           if (!newJuzProgress.includes(juzSekarang)) {
               newJuzProgress = [...newJuzProgress, juzSekarang]
           }
        }

        await tx
          .update(santri)
          .set({ 
            posisiTerakhir: { surahNomor: payload.surahNomor, ayat: payload.ayatAkhir },
            juzProgress: newJuzProgress
          })
          .where(eq(santri.id, payload.santriId))
      }

      return newSetoran
    });
    
    console.log("Result:", result)
  } catch (err) {
    console.error("CAUGHT ERROR IN TEST SCRIPT:")
    console.error(err)
  }
}

run()

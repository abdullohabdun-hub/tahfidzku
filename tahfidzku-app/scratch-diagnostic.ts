import { db } from './src/db/index';
import { santri, setoran } from './src/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { surahByNomor } from './src/lib/quranMapper';

const surahList = Object.values(surahByNomor);

async function run() {
  const allSantri = await db.select().from(santri);
  const affected = [];

  for (const s of allSantri) {
    // Get latest ziyadah
    const [latestZiyadah] = await db.select().from(setoran)
      .where(and(eq(setoran.santriId, s.id), eq(setoran.jenis, 'ziyadah')))
      .orderBy(desc(setoran.createdAt))
      .limit(1);

    if (latestZiyadah && latestZiyadah.surahMeta) {
      const meta = (latestZiyadah.surahMeta as any).meta;
      
      let isCrossSurah = false;
      let targetSurahNomor = latestZiyadah.surahNomor;
      
      if (meta && meta[0] && meta[0].surahSelesai) {
        if (meta[0].surahSelesai.nomor && meta[0].surahSelesai.nomor !== latestZiyadah.surahNomor) {
           isCrossSurah = true;
           targetSurahNomor = meta[0].surahSelesai.nomor;
        }
      } else if ((latestZiyadah.surahMeta as any).label) {
        const label = (latestZiyadah.surahMeta as any).label;
        if (label.includes('-') && label.split('-').length > 1) {
            const parts = label.split('-');
            const secondPart = parts[1].trim();
            // find if any surah name is in the second part
            for (const surah of surahList) {
                if (secondPart.toLowerCase().includes(surah.nama.toLowerCase())) {
                    isCrossSurah = true;
                    targetSurahNomor = surah.nomor;
                    break;
                }
            }
        }
      }

      if (isCrossSurah) {
        const posisiSeharusnya = { surahNomor: targetSurahNomor, ayat: latestZiyadah.ayatAkhir };
        
        if (
          !s.posisiTerakhir || 
          s.posisiTerakhir.surahNomor !== posisiSeharusnya.surahNomor || 
          s.posisiTerakhir.ayat !== posisiSeharusnya.ayat
        ) {
          affected.push({
            nama: s.nama,
            setoranLabel: (latestZiyadah.surahMeta as any).label,
            posisiLama: s.posisiTerakhir,
            posisiSeharusnya
          });
        }
      }
    }
  }

  console.log(JSON.stringify(affected, null, 2));
  process.exit(0);
}
run().catch(console.error);

import { db } from './src/db/index';
import { santri, setoran } from './src/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { surahByNomor } from './src/lib/quranMapper';

const surahList = Object.values(surahByNomor);

async function run() {
  const allSetoran = await db.select().from(setoran).where(eq(setoran.jenis, 'ziyadah'));
  console.log(`Total Ziyadah Setoran: ${allSetoran.length}`);
  const crossSurahSetoran = [];

  for (const latestZiyadah of allSetoran) {
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
        crossSurahSetoran.push(latestZiyadah);
      }
    }
  }

  console.log(`Total Cross Surah Ziyadah: ${crossSurahSetoran.length}`);
  console.log(JSON.stringify(crossSurahSetoran, null, 2));
  process.exit(0);
}
run().catch(console.error);

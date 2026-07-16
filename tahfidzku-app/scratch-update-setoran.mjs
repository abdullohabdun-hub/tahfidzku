import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/server-fns/setoran.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add kalkulasiPosisiTerakhirZiyadah helper
const helperCode = `
// Helper function to safely calculate the final position for Ziyadah
// This ensures that even for cross-surah entries, we pick the true ending point.
function kalkulasiPosisiTerakhirZiyadah(payloadSurahNomor: number, payloadAyatAkhir: number, surahMeta?: any) {
  let akhirSurahNomor = payloadSurahNomor;
  let akhirAyat = payloadAyatAkhir;

  if (surahMeta && Array.isArray(surahMeta.meta) && surahMeta.meta.length > 0) {
    // Always use the LAST segment in case of multiple segments
    const lastSegmen = surahMeta.meta[surahMeta.meta.length - 1];
    if (lastSegmen && lastSegmen.surahSelesai) {
      akhirSurahNomor = lastSegmen.surahSelesai.nomor ?? akhirSurahNomor;
      akhirAyat = lastSegmen.surahSelesai.ayat ?? akhirAyat;
    }
  }

  return { surahNomor: akhirSurahNomor, ayat: akhirAyat };
}

// ═══════════════════════════════════════════════════════`;
content = content.replace('// ═══════════════════════════════════════════════════════', helperCode);

// 2. Replace in createSetoran
const createSearch = `      // 2. Update tracker posisiTerakhir jika Ziyadah
      if (data.jenis === 'ziyadah' && data.surahNomor && data.ayatAkhir) {
        const currentSantri = await db.select({ juzProgress: santri.juzProgress }).from(santri).where(eq(santri.id, data.santriId)).limit(1)
        let newJuzProgress = currentSantri[0]?.juzProgress || []

        const juzSekarang = cariJuzUntukAyat(data.surahNomor, data.ayatAkhir)
        const akhirJuz = getAyatTerakhirJuz(juzSekarang)
        
        if (data.surahNomor === akhirJuz.surahNomor && data.ayatAkhir === akhirJuz.ayat) {
           if (!newJuzProgress.includes(juzSekarang)) {
               newJuzProgress = [...newJuzProgress, juzSekarang]
           }
        }

        await db
          .update(santri)
          .set({ 
            posisiTerakhir: { surahNomor: data.surahNomor, ayat: data.ayatAkhir },`;

const createReplace = `      // 2. Update tracker posisiTerakhir jika Ziyadah
      if (data.jenis === 'ziyadah' && data.surahNomor && data.ayatAkhir) {
        const posisi = kalkulasiPosisiTerakhirZiyadah(data.surahNomor, data.ayatAkhir, data.surahMeta);

        const currentSantri = await db.select({ juzProgress: santri.juzProgress }).from(santri).where(eq(santri.id, data.santriId)).limit(1)
        let newJuzProgress = currentSantri[0]?.juzProgress || []

        const juzSekarang = cariJuzUntukAyat(posisi.surahNomor, posisi.ayat)
        const akhirJuz = getAyatTerakhirJuz(juzSekarang)
        
        if (posisi.surahNomor === akhirJuz.surahNomor && posisi.ayat === akhirJuz.ayat) {
           if (!newJuzProgress.includes(juzSekarang)) {
               newJuzProgress = [...newJuzProgress, juzSekarang]
           }
        }

        await db
          .update(santri)
          .set({ 
            posisiTerakhir: posisi,`;
content = content.replace(createSearch, createReplace);

// 3. Replace in updateSetoran
const updateSearch = `        // Hitung ulang posisiTerakhir
        const currentSantri = await db.select({ juzProgress: santri.juzProgress }).from(santri).where(eq(santri.id, data.santriId)).limit(1)
        let newJuzProgress = currentSantri[0]?.juzProgress || []

        const juzSekarang = cariJuzUntukAyat(data.surahNomor, data.ayatAkhir)
        const akhirJuz = getAyatTerakhirJuz(juzSekarang)
        
        if (data.surahNomor === akhirJuz.surahNomor && data.ayatAkhir === akhirJuz.ayat) {
           if (!newJuzProgress.includes(juzSekarang)) {
               newJuzProgress = [...newJuzProgress, juzSekarang]
           }
        }

        await db
          .update(santri)
          .set({ 
            posisiTerakhir: { surahNomor: data.surahNomor, ayat: data.ayatAkhir },`;

const updateReplace = `        // Hitung ulang posisiTerakhir
        const posisi = kalkulasiPosisiTerakhirZiyadah(data.surahNomor, data.ayatAkhir, data.surahMeta);

        const currentSantri = await db.select({ juzProgress: santri.juzProgress }).from(santri).where(eq(santri.id, data.santriId)).limit(1)
        let newJuzProgress = currentSantri[0]?.juzProgress || []

        const juzSekarang = cariJuzUntukAyat(posisi.surahNomor, posisi.ayat)
        const akhirJuz = getAyatTerakhirJuz(juzSekarang)
        
        if (posisi.surahNomor === akhirJuz.surahNomor && posisi.ayat === akhirJuz.ayat) {
           if (!newJuzProgress.includes(juzSekarang)) {
               newJuzProgress = [...newJuzProgress, juzSekarang]
           }
        }

        await db
          .update(santri)
          .set({ 
            posisiTerakhir: posisi,`;
content = content.replace(updateSearch, updateReplace);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('setoran.ts updated successfully');

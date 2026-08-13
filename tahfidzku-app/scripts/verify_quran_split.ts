import { getSurahByJuz, getAyatRangeInJuz, surahByNomor, buatSurahMeta } from '../src/lib/quranMapper'
import { JUZ_TABLE, SURAH_LIST } from '../src/lib/quranData'

console.log('=== VERIFIKASI QURAN DATA & MAPPER SPLIT ===')

// 1. Check Juz 30 Surahs
const surahsJuz30 = getSurahByJuz(30)
console.log(`Juz 30 total surah: ${surahsJuz30.length}`)
console.log(`Surah pertama Juz 30: ${surahsJuz30[0]?.nama} (Surah #${surahsJuz30[0]?.nomor})`)
console.log(`Surah terakhir Juz 30: ${surahsJuz30[surahsJuz30.length - 1]?.nama} (Surah #${surahsJuz30[surahsJuz30.length - 1]?.nomor})`)

// 2. Check Ayat Range for An-Naba in Juz 30
const rangeAnNaba = getAyatRangeInJuz(30, 78)
console.log(`An-Naba (Surah 78) range in Juz 30: Ayat ${rangeAnNaba.ayatAwal} - ${rangeAnNaba.ayatAkhir}`)

// 3. Check surahByNomor lookup for Yasin (Surah 36)
const yasin = surahByNomor[36]
console.log(`Surah #36: ${yasin?.nama}, Total Ayat: ${yasin?.totalAyat}`)

// 4. Check buatSurahMeta for Juz 30 Halaman 1-2
const meta = buatSurahMeta(30, 1, 2)
console.log('SurahMeta Juz 30 Halaman 1-2:', JSON.stringify(meta, null, 2))

if (surahsJuz30.length > 0 && rangeAnNaba.ayatAkhir === 40 && yasin?.totalAyat === 83 && meta) {
  console.log('✅ ALL QURAN DATA & MAPPER VERIFICATIONS PASSED 100%!')
} else {
  console.error('❌ VERIFICATION FAILED')
  process.exit(1)
}

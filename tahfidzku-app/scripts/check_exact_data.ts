import { JUZ_TABLE, SURAH_LIST, PAGES_DATA, surahByNomor } from '../src/lib/quranData'

console.log('====================================================')
console.log('       PEMERIKSAAN KELENGKAPAN DATA QURANDATA.TS    ')
console.log('====================================================')

// 1. Verifikasi JUZ_TABLE (1 - 30)
console.log('\n--- 1. VERIFIKASI JUZ_TABLE ---')
console.log(`Total Juz Terdaftar: ${JUZ_TABLE.length} / 30`)
const juz1 = JUZ_TABLE.find(j => j.juz === 1)
const juz30 = JUZ_TABLE.find(j => j.juz === 30)
console.log(`Juz 1 : Halaman ${juz1?.halamanAwal} s/d ${juz1?.halamanAkhir}`)
console.log(`Juz 30: Halaman ${juz30?.halamanAwal} s/d ${juz30?.halamanAkhir}`)

const missingJuz = []
for (let i = 1; i <= 30; i++) {
  if (!JUZ_TABLE.some(j => j.juz === i)) missingJuz.push(i)
}
console.log(`Juz Hilang: ${missingJuz.length === 0 ? 'TIDAK ADA (100% Utuh 1-30)' : missingJuz.join(', ')}`)

// 2. Verifikasi SURAH_LIST (1 - 114)
console.log('\n--- 2. VERIFIKASI SURAH_LIST ---')
console.log(`Total Surah Terdaftar: ${SURAH_LIST.length} / 114`)
console.log(`Surah #1  : ${SURAH_LIST[0]?.nama} (${SURAH_LIST[0]?.totalAyat} ayat)`)
console.log(`Surah #114: ${SURAH_LIST[113]?.nama} (${SURAH_LIST[113]?.totalAyat} ayat)`)

const missingSurah = []
for (let i = 1; i <= 114; i++) {
  if (!SURAH_LIST.some(s => s.nomor === i)) missingSurah.push(i)
}
console.log(`Surah Hilang: ${missingSurah.length === 0 ? 'TIDAK ADA (100% Utuh 1-114)' : missingSurah.join(', ')}`)

// 3. Verifikasi PAGES_DATA (1 - 604)
console.log('\n--- 3. VERIFIKASI PAGES_DATA ---')
console.log(`Total Halaman Mushaf Terdaftar: ${PAGES_DATA.length} / 604`)
console.log(`Halaman 1   : Surah ${PAGES_DATA[0]?.surahs[0]?.nama} (Ayat ${PAGES_DATA[0]?.surahs[0]?.ayatAwal}-${PAGES_DATA[0]?.surahs[0]?.ayatAkhir})`)
console.log(`Halaman 604 : Surah ${PAGES_DATA[603]?.surahs[PAGES_DATA[603]?.surahs.length - 1]?.nama} (Ayat ${PAGES_DATA[603]?.surahs[PAGES_DATA[603]?.surahs.length - 1]?.ayatAwal}-${PAGES_DATA[603]?.surahs[PAGES_DATA[603]?.surahs.length - 1]?.ayatAkhir})`)

const missingPage = []
for (let i = 1; i <= 604; i++) {
  if (!PAGES_DATA.some(p => p.halaman === i)) missingPage.push(i)
}
console.log(`Halaman Hilang: ${missingPage.length === 0 ? 'TIDAK ADA (100% Utuh Halaman 1 - 604)' : missingPage.join(', ')}`)

// 4. Verifikasi Object Map surahByNomor
console.log('\n--- 4. VERIFIKASI SURAHBYNOMOR ---')
console.log(`Total Key surahByNomor: ${Object.keys(surahByNomor).length} / 114`)
console.log(`Sample surahByNomor[36] (Yasin): ${surahByNomor[36]?.nama} - ${surahByNomor[36]?.totalAyat} Ayat`)

console.log('\n====================================================')
if (JUZ_TABLE.length === 30 && SURAH_LIST.length === 114 && PAGES_DATA.length === 604 && missingJuz.length === 0 && missingSurah.length === 0 && missingPage.length === 0) {
  console.log('✅ HASI VERIFIKASI: DATA QURANDATA.TS 100% LENGKAP & LELUASA UTUH!')
} else {
  console.error('❌ ADA DATA YANG TERPOTONG!')
  process.exit(1)
}
console.log('====================================================')

// @ts-nocheck
// quranMapper.ts - Helper utilities untuk Al-Qur'an
// Data statis dipisahkan ke quranData.ts untuk efisiensi code splitting bundle client.

import { JUZ_TABLE, SURAH_LIST, PAGES_DATA, surahByNomor } from './quranData'
export { JUZ_TABLE, SURAH_LIST, PAGES_DATA, surahByNomor }

export function getRentangHalamanJuz(juz) {
  const entry = JUZ_TABLE.find((j) => j.juz === juz);
  if (!entry) throw new Error(`Juz tidak valid: ${juz}`);
  return { halamanAwal: entry.halamanAwal, halamanAkhir: entry.halamanAkhir };
}

export function getMaksimalHalamanRelatif(juz) {
  const { halamanAwal, halamanAkhir } = getRentangHalamanJuz(juz);
  return halamanAkhir - halamanAwal + 1;
}

export function halamanRelatifKeAbsolut(juz, halamanRelatif) {
  const { halamanAwal, halamanAkhir } = getRentangHalamanJuz(juz);
  const absolut = halamanAwal + halamanRelatif - 1;
  return absolut > halamanAkhir ? null : absolut;
}

export function halamanAbsolutKeRelatif(halamanAbsolut) {
  const entry = JUZ_TABLE.find(
    (j) => halamanAbsolut >= j.halamanAwal && halamanAbsolut <= j.halamanAkhir
  );
  if (!entry) throw new Error(`Halaman absolut tidak valid: ${halamanAbsolut}`);
  return {
    juz: entry.juz,
    halamanRelatif: halamanAbsolut - entry.halamanAwal + 1,
    maksimalHalamanRelatif: entry.halamanAkhir - entry.halamanAwal + 1,
  };
}

export function getSurahDiHalaman(halamanAbsolut) {
  const page = PAGES_DATA.find((p) => p.halaman === halamanAbsolut);
  if (!page) throw new Error(`Halaman tidak ditemukan: ${halamanAbsolut}`);
  return page.surahs;
}

export function isPecahanHalamanValid(nilai) {
  const desimal = Math.round((nilai % 1) * 100) / 100;
  return [0, 0.25, 0.5, 0.75].includes(desimal);
}

/**
 * Fungsi utama quranMapper: dari (juz, halamanRelatifMulai, halamanRelatifSelesai)
 * menghasilkan data lengkap untuk disimpan sebagai field `surahMeta` pada dokumen setoran.
 * Mengembalikan null jika halamanRelatifSelesai melebihi batas juz (caller menangani via
 * alur "Tambah Setoran Lanjutan", bukan menampilkan error keras ke Musyrifah).
 */
export function buatSurahMeta(juz, halamanRelatifMulai, halamanRelatifSelesai) {
  const absolutMulai = halamanRelatifKeAbsolut(juz, halamanRelatifMulai);
  const absolutSelesai = halamanRelatifKeAbsolut(juz, halamanRelatifSelesai);
  if (absolutMulai === null || absolutSelesai === null) return null;

  return _surahMetaDariAbsolut(absolutMulai, absolutSelesai);
}

/**
 * ==========================================================================
 * EKSTENSI: rekam-jejak Ziyadah, presisi ayat, dan setoran lintas-juz
 * ==========================================================================
 */

/**
 * Inti pembacaan surah dari rentang halaman ABSOLUT (1-604), lepas dari
 * konsep "relatif per-juz". Dipakai bersama oleh buatSurahMeta() (dalam-juz)
 * dan buatSurahMetaLintasJuz() (lintas-juz) supaya labelnya selalu konsisten.
 */
function _surahMetaDariAbsolut(absolutMulai, absolutSelesai) {
  if (absolutMulai > absolutSelesai) {
    throw new Error("Halaman mulai tidak boleh lebih besar dari halaman selesai");
  }

  const surahMulai = getSurahDiHalaman(absolutMulai)[0];
  const surahSelesaiList = getSurahDiHalaman(absolutSelesai);
  const surahSelesai = surahSelesaiList[surahSelesaiList.length - 1];

  const ayatAwal = surahMulai.ayatAwal;
  const ayatAkhir = surahSelesai.ayatAkhir;

  let label;
  if (surahMulai.nomor === surahSelesai.nomor) {
    // Kasus umum: satu surah saja. Contoh: "An-Naba 1-30"
    label = `${surahMulai.nama} ${ayatAwal}-${ayatAkhir}`;
  } else {
    // Kasus lintas-surah dalam satu entri (mis. Juz 30 yang surahnya banyak & pendek,
    // atau setoran lintas-juz yang otomatis lintas-surah juga).
    const totalAyatSurahMulai = surahByNomor[surahMulai.nomor]?.totalAyat ?? ayatAwal;
    label = `${surahMulai.nama} ${ayatAwal}-${totalAyatSurahMulai} - ${surahSelesai.nama} 1-${ayatAkhir}`;
  }

  return {
    halamanAbsolutMulai: absolutMulai,
    halamanAbsolutSelesai: absolutSelesai,
    surahMulai: { nomor: surahMulai.nomor, nama: surahMulai.nama, ayat: ayatAwal },
    surahSelesai: { nomor: surahSelesai.nomor, nama: surahSelesai.nama, ayat: ayatAkhir },
    label,
  };
}

/**
 * (1) ZIYADAH — rekam jejak setoran kemarin.
 * Mengembalikan posisi ayat SETELAH (surahNomor, ayat), melompat otomatis
 * ke surah berikutnya bila ayat sudah di ayat terakhir surah tsb.
 * Mengembalikan null jika (surahNomor, ayat) sudah An-Nas 6 (khatam 30 juz).
 */
export function ayatBerikutnya(surahNomor, ayat) {
  const surah = surahByNomor[surahNomor];
  if (!surah) throw new Error(`Surah tidak valid: ${surahNomor}`);
  if (ayat < 1 || ayat > surah.totalAyat) {
    throw new Error(`Ayat ${ayat} di luar rentang surah ${surah.nama} (1-${surah.totalAyat})`);
  }
  if (ayat < surah.totalAyat) {
    return { surahNomor, ayat: ayat + 1 };
  }
  const surahBerikut = surahByNomor[surahNomor + 1];
  return surahBerikut ? { surahNomor: surahBerikut.nomor, ayat: 1 } : null;
}

/**
 * (Prefill Ziyadah versi lengkap, memperhitungkan urutanHafalan custom,
 * didefinisikan lebih bawah sebagai prefillZiyadahBerikutnya().)
 */

/**
 * (2C/2D) SABQI & MANZIL — versi buatSurahMeta() yang mendukung rentang
 * LINTAS JUZ, mis. juz 29 halaman 18 s.d. juz 30 halaman 2. Menerima
 * (juz, halamanRelatif) di kedua ujung rentang secara independen, sehingga
 * otomatis juga menangani surah yang menyeberang batas juz (2D) karena
 * pembacaannya memakai getSurahDiHalaman() di ruang halaman absolut.
 */
export function buatSurahMetaLintasJuz(juzMulai, halamanRelatifMulai, juzSelesai, halamanRelatifSelesai) {
  const absolutMulai = halamanRelatifKeAbsolut(juzMulai, halamanRelatifMulai);
  const absolutSelesai = halamanRelatifKeAbsolut(juzSelesai, halamanRelatifSelesai);
  if (absolutMulai === null || absolutSelesai === null) return null;

  const meta = _surahMetaDariAbsolut(absolutMulai, absolutSelesai);
  return { ...meta, juzMulai, juzSelesai, lintasJuz: juzMulai !== juzSelesai };
}

/**
 * Pembungkus praktis untuk form Sabqi/Manzil: otomatis memilih antara
 * buatSurahMeta (dalam-juz) dan buatSurahMetaLintasJuz (lintas-juz),
 * supaya UI cukup panggil satu fungsi ini tanpa perlu tahu kasus mana yang
 * sedang terjadi. Selalu mengembalikan field `lintasJuz` untuk ditampilkan.
 */
export function buatSurahMetaOtomatis(juzMulai, halamanRelatifMulai, juzSelesai, halamanRelatifSelesai) {
  if (juzMulai === juzSelesai) {
    const hasil = buatSurahMeta(juzMulai, halamanRelatifMulai, halamanRelatifSelesai);
    if (hasil !== null) return { ...hasil, juzMulai, juzSelesai, lintasJuz: false };
    // halamanRelatifSelesai melebihi batas juzMulai -> jatuhkan ke jalur lintas-juz
  }
  return buatSurahMetaLintasJuz(juzMulai, halamanRelatifMulai, juzSelesai, halamanRelatifSelesai);
}

/**
 * (2B) Presisi ¼/½/¾ halaman — menerapkan override ayat manual (opsional)
 * dari ustadz di atas hasil auto-deteksi berbasis batas halaman penuh.
 * Dipakai saat setoran berhenti di TENGAH halaman, bukan di ujungnya, jadi
 * ayat hasil auto-deteksi (dari batas halaman) perlu dikoreksi manual.
 * Halaman & pecahan halaman tetap dipakai apa adanya sebagai metrik jumlah
 * bacaan; hanya label & rentang ayat presisi yang dikoreksi di sini.
 *
 * meta          : hasil dari buatSurahMeta / buatSurahMetaLintasJuz / buatSurahMetaOtomatis
 * overrideAwal  : { surahNomor, ayat } | null  (biarkan null jika tidak dikoreksi)
 * overrideAkhir : { surahNomor, ayat } | null
 */
export function terapkanOverrideAyat(meta, overrideAwal, overrideAkhir) {
  if (!meta) return meta;

  const surahMulaiNomor = overrideAwal?.surahNomor || meta.surahMulai.nomor;
  const surahSelesaiNomor = overrideAkhir?.surahNomor || meta.surahSelesai.nomor;

  const surahMulai = overrideAwal
    ? { nomor: surahMulaiNomor, nama: surahByNomor[surahMulaiNomor]?.nama || meta.surahMulai.nama, ayat: overrideAwal.ayat || meta.surahMulai.ayat }
    : meta.surahMulai;
    
  const surahSelesai = overrideAkhir
    ? { nomor: surahSelesaiNomor, nama: surahByNomor[surahSelesaiNomor]?.nama || meta.surahSelesai.nama, ayat: overrideAkhir.ayat || meta.surahSelesai.ayat }
    : meta.surahSelesai;

  let label;
  if (surahMulai.nomor === surahSelesai.nomor) {
    label = `${surahMulai.nama} ${surahMulai.ayat}-${surahSelesai.ayat}`;
  } else {
    const totalAyatSurahMulai = surahByNomor[surahMulai.nomor]?.totalAyat ?? surahMulai.ayat;
    label = `${surahMulai.nama} ${surahMulai.ayat}-${totalAyatSurahMulai} - ${surahSelesai.nama} 1-${surahSelesai.ayat}`;
  }

  // Update inner meta array too
  let newMetaArray = meta.meta ? [...meta.meta] : [];
  if (newMetaArray.length > 0) {
    newMetaArray[0] = { ...newMetaArray[0], surahMulai: { ...surahMulai } };
    newMetaArray[newMetaArray.length - 1] = { ...newMetaArray[newMetaArray.length - 1], surahSelesai: { ...surahSelesai } };
  }

  return {
    ...meta,
    meta: newMetaArray,
    surahMulai,
    surahSelesai,
    label,
    presisiManual: Boolean(overrideAwal || overrideAkhir),
  };
}

/**
 * ==========================================================================
 * PERBAIKAN: santri dengan hafalan sebelumnya + urutan hafalan custom
 *            (mis. mulai dari Juz 30 mundur), dan ziyadah lintas-surat.
 * ==========================================================================
 */

/**
 * Mencari juz yang memuat sebuah posisi ayat. Diperlukan karena urutan
 * hafalan santri bisa TIDAK linear (surah 1->114), mis. santri mulai dari
 * Juz 30 lalu mundur ke Juz 29, 28, dst.
 */
export function cariJuzUntukAyat(surahNomor, ayat) {
  for (const halaman of PAGES_DATA) {
    for (const seg of halaman.surahs) {
      if (seg.nomor === surahNomor && ayat >= seg.ayatAwal && ayat <= seg.ayatAkhir) {
        return halaman.juz;
      }
    }
  }
  throw new Error(`Posisi tidak ditemukan: surah ${surahNomor} ayat ${ayat}`);
}

/** Ayat pertama pada sebuah juz (surah & nomor ayat di halaman pertama juz itu). */
export function getAyatPertamaJuz(juz) {
  const { halamanAwal } = getRentangHalamanJuz(juz);
  const seg = getSurahDiHalaman(halamanAwal)[0];
  return { surahNomor: seg.nomor, ayat: seg.ayatAwal };
}

/** Ayat terakhir pada sebuah juz (surah & nomor ayat di halaman terakhir juz itu). */
export function getAyatTerakhirJuz(juz) {
  const { halamanAkhir } = getRentangHalamanJuz(juz);
  const segList = getSurahDiHalaman(halamanAkhir);
  const seg = segList[segList.length - 1];
  return { surahNomor: seg.nomor, ayat: seg.ayatAkhir };
}

/** Preset: urutan standar Juz 1 -> 30 (default untuk santri baru). */
export function urutanJuzStandar() {
  return Array.from({ length: 30 }, (_, i) => i + 1);
}

/** Preset: urutan mundur Juz 30 -> 1 (pola umum di lapangan: mulai dari surat pendek). */
export function urutanJuzMundurDari30() {
  return Array.from({ length: 30 }, (_, i) => 30 - i);
}

/**
 * (1) ZIYADAH — posisi berikutnya yang MENGERTI urutan hafalan santri.
 * urutanHafalan: array 30 nomor juz sesuai urutan yang dijalani santri,
 * mis. urutanJuzStandar() atau urutanJuzMundurDari30() atau susunan custom
 * apa pun (mis. [30, 29, 26, 27, 28, 25, ...]) yang diatur admin/ustadz.
 *
 * Selama posisi belum di ayat TERAKHIR juz saat ini, tetap maju normal
 * dalam mushaf (bisa lintas surat, lihat ayatBerikutnya). Begitu posisi
 * sudah di ayat terakhir juz saat ini, lompat ke ayat PERTAMA juz
 * berikutnya sesuai urutanHafalan -- baik itu nomor juz lebih besar
 * maupun lebih kecil.
 */
export function posisiHafalanBerikutnya(surahNomor, ayat, urutanHafalan) {
  const juzSekarang = cariJuzUntukAyat(surahNomor, ayat);
  const akhirJuz = getAyatTerakhirJuz(juzSekarang);
  const sudahDiAkhirJuz = akhirJuz.surahNomor === surahNomor && akhirJuz.ayat === ayat;

  if (!sudahDiAkhirJuz) {
    const next = ayatBerikutnya(surahNomor, ayat);
    return next ? { ...next, juz: juzSekarang } : null;
  }

  const idx = urutanHafalan.indexOf(juzSekarang);
  const juzBerikutnya = idx >= 0 && idx < urutanHafalan.length - 1 ? urutanHafalan[idx + 1] : null;
  if (juzBerikutnya === null) return null; // sudah menuntaskan seluruh urutan hafalan

  const awal = getAyatPertamaJuz(juzBerikutnya);
  return { surahNomor: awal.surahNomor, ayat: awal.ayat, juz: juzBerikutnya };
}

/**
 * Versi baru prefillZiyadahBerikutnya() yang menerima urutanHafalan.
 * posisiTerakhir null -> mulai dari ayat pertama juz PERTAMA di urutanHafalan
 * (bukan selalu Al-Fatiha -- kalau urutanHafalan dimulai dari Juz 30, maka
 * santri baru pun mulai dari An-Naba ayat 1).
 */
export function prefillZiyadahBerikutnya(posisiTerakhir, urutanHafalan = urutanJuzStandar()) {
  if (!posisiTerakhir) {
    const awal = getAyatPertamaJuz(urutanHafalan[0]);
    return { surahNomor: awal.surahNomor, namaSurah: surahByNomor[awal.surahNomor].nama, ayat: awal.ayat };
  }
  const next = posisiHafalanBerikutnya(posisiTerakhir.surahNomor, posisiTerakhir.ayat, urutanHafalan);
  if (!next) return null;
  return { surahNomor: next.surahNomor, namaSurah: surahByNomor[next.surahNomor].nama, ayat: next.ayat };
}

/**
 * Untuk ONBOARDING santri yang sudah punya hafalan sebelumnya (mis. sudah
 * hafal 2 juz: Juz 30 dan Juz 29). Admin cukup memasukkan BERAPA JUZ
 * PERTAMA dari urutanHafalan yang sudah tuntas -- fungsi ini menghitung
 * posisiTerakhir yang tepat, siap dipakai prefillZiyadahBerikutnya().
 * Untuk kasus juz belum tuntas penuh / urutan tidak berurutan, admin bisa
 * set posisiTerakhir secara manual (surah+ayat) tanpa lewat fungsi ini.
 */
export function posisiTerakhirDariJumlahJuzSelesai(urutanHafalan, jumlahJuzSelesai) {
  if (jumlahJuzSelesai <= 0) return null;
  const juzTerakhirSelesai = urutanHafalan[jumlahJuzSelesai - 1];
  return getAyatTerakhirJuz(juzTerakhirSelesai);
}

/**
 * (2) ZIYADAH LINTAS-SURAT — label untuk rentang ayat yang bisa melewati
 * lebih dari satu surat dalam SATU entri setoran (mis. santri menghabiskan
 * An-Nas lalu lanjut beberapa ayat Al-Falaq dalam setoran yang sama).
 * Dalam satu entri, arah baca selalu maju di dalam mushaf, jadi
 * surahSelesaiNomor harus >= surahMulaiNomor.
 */
export function labelRentangAyatZiyadah(surahMulaiNomor, ayatMulai, surahSelesaiNomor, ayatSelesai) {
  if (surahSelesaiNomor < surahMulaiNomor || (surahSelesaiNomor === surahMulaiNomor && ayatSelesai < ayatMulai)) {
    throw new Error("Ayat selesai harus berada setelah ayat mulai di dalam mushaf.");
  }
  const sMulai = surahByNomor[surahMulaiNomor];
  const sSelesai = surahByNomor[surahSelesaiNomor];

  if (surahMulaiNomor === surahSelesaiNomor) {
    return ayatMulai === ayatSelesai
      ? `${sMulai.nama} ayat ${ayatMulai}`
      : `${sMulai.nama} ayat ${ayatMulai}-${ayatSelesai}`;
  }

  const bagian = [`${sMulai.nama} ${ayatMulai}-${sMulai.totalAyat}`];
  for (let n = surahMulaiNomor + 1; n < surahSelesaiNomor; n++) {
    bagian.push(`${surahByNomor[n].nama} (utuh)`);
  }
  bagian.push(`${sSelesai.nama} 1-${ayatSelesai}`);
  return bagian.join(" - ");
}

/**
 * ==========================================================================
 * PERBAIKAN: parsing input halaman dengan pecahan (bug "1,5" tidak terbaca)
 * ==========================================================================
 */

/**
 * Parser toleran untuk field "Halaman" yang mendukung notasi pecahan ala
 * Indonesia (koma) maupun titik -- mis. "1,5", "1.5", "1,25", atau "12"
 * biasa. Mengembalikan { halaman, pecahan }:
 *   - halaman  : nomor halaman relatif BULAT yang sedang dibaca
 *   - pecahan  : seberapa jauh halaman itu terbaca (0 = penuh/utuh,
 *                0.25 / 0.5 / 0.75 = seperempat / setengah / tigaperempat)
 * Melempar Error dengan pesan jelas kalau formatnya tidak dikenali, supaya
 * UI bisa menampilkan alasan gagal-nya alih-alih diam-diam menampilkan
 * "lengkapi input" seperti sebelumnya.
 */
export function parseHalamanPecahan(input) {
  if (input === null || input === undefined || String(input).trim() === "") {
    throw new Error("Halaman belum diisi.");
  }
  const dibersihkan = String(input).trim().replace(",", ".");
  const nilai = Number(dibersihkan);
  if (Number.isNaN(nilai)) {
    throw new Error(`"${input}" bukan format halaman yang dikenali. Contoh: 3 atau 3,5`);
  }
  if (nilai < 1) {
    throw new Error("Nomor halaman minimal 1.");
  }
  const halaman = Math.floor(nilai);
  const pecahan = Math.round((nilai - halaman) * 100) / 100;
  if (![0, 0.25, 0.5, 0.75].includes(pecahan)) {
    throw new Error(`Pecahan ",${String(pecahan).split(".")[1] || "0"}" tidak dikenali. Gunakan ,25 / ,5 / ,75 atau tanpa pecahan.`);
  }
  return { halaman, pecahan };
}

export function getSurahByJuz(juz) {
  const juzInfo = JUZ_TABLE.find(j => j.juz === juz);
  if (!juzInfo) return [];
  const surahsMap = new Map();
  for (let i = juzInfo.halamanAwal; i <= juzInfo.halamanAkhir; i++) {
    const surahs = getSurahDiHalaman(i);
    for (const s of surahs) {
      if (!surahsMap.has(s.nomor)) surahsMap.set(s.nomor, s);
    }
  }
  return Array.from(surahsMap.values());
}

export function getAyatRangeInJuz(juz, surahNomor) {
  const juzInfo = JUZ_TABLE.find(j => j.juz === juz);
  if (!juzInfo) return { ayatAwal: 1, ayatAkhir: 1 };
  let ayatAwal = 9999, ayatAkhir = -1;
  for (let i = juzInfo.halamanAwal; i <= juzInfo.halamanAkhir; i++) {
    const surahs = getSurahDiHalaman(i);
    const s = surahs.find(x => x.nomor === surahNomor);
    if (s) {
      if (s.ayatAwal < ayatAwal) ayatAwal = s.ayatAwal;
      if (s.ayatAkhir > ayatAkhir) ayatAkhir = s.ayatAkhir;
    }
  }
  return { ayatAwal: ayatAwal === 9999 ? 1 : ayatAwal, ayatAkhir: ayatAkhir === -1 ? 1 : ayatAkhir };
}

export function getTotalHalamanJuz(juz) {
  const juzInfo = JUZ_TABLE.find(j => j.juz === juz);
  return juzInfo ? juzInfo.halamanAkhir - juzInfo.halamanAwal + 1 : 0;
}



export function cariHalamanAbsolutUntukAyat(surahNomor, ayat) {
  for (const page of PAGES_DATA) {
    const found = page.surahs.find(s => s.nomor === surahNomor && ayat >= s.ayatAwal && ayat <= s.ayatAkhir);
    if (found) return page.halaman;
  }
  return 1;
}

export function cariHalamanAbsolutUntukAyatOrNull(surahNomor: number, ayat: number): number | null {
  for (const page of PAGES_DATA) {
    const found = page.surahs.find(s => s.nomor === surahNomor && ayat >= s.ayatAwal && ayat <= s.ayatAkhir);
    if (found) return page.halaman;
  }
  return null;
}

export function derivasiPrefillSabqiManzil(
  posisiTerakhir: { surahNomor: number; ayat: number } | null | undefined
): { juz: number; halamanAwal: string; halamanAkhir: string } | null {
  if (!posisiTerakhir) return null;

  const halamanAbsolut = cariHalamanAbsolutUntukAyatOrNull(
    posisiTerakhir.surahNomor,
    posisiTerakhir.ayat
  );
  if (halamanAbsolut === null) return null;

  try {
    const { juz, halamanRelatif } = halamanAbsolutKeRelatif(halamanAbsolut);
    return {
      juz,
      halamanAwal: String(halamanRelatif),
      halamanAkhir: String(halamanRelatif),
    };
  } catch {
    return null;
  }
}

export function hitungKelanjutanMurojaah(
  lastSetoran: { juzMulai?: number; juzSelesai?: number; halamanAkhir?: string | number } | null | undefined,
  fallbackPosisi: { surahNomor: number; ayat: number } | null | undefined
): { juz: number; halamanAwal: string; halamanAkhir: string } | null {
  if (lastSetoran && lastSetoran.halamanAkhir !== undefined && lastSetoran.halamanAkhir !== null) {
    const juz = lastSetoran.juzSelesai || lastSetoran.juzMulai || 30
    const currentHal = typeof lastSetoran.halamanAkhir === 'number'
      ? lastSetoran.halamanAkhir
      : parseFloat(String(lastSetoran.halamanAkhir).replace(',', '.'))

    if (!isNaN(currentHal)) {
      const juzInfo = JUZ_TABLE.find(j => j.juz === juz)
      const maxHalInJuz = juzInfo ? (juzInfo.halamanAkhir - juzInfo.halamanAwal + 1) : 20
      let nextHal = Math.floor(currentHal) + 1
      let nextJuz = juz

      if (nextHal > maxHalInJuz) {
        nextHal = 1
        nextJuz = juz >= 30 ? 1 : juz + 1
      }

      return {
        juz: nextJuz,
        halamanAwal: String(nextHal),
        halamanAkhir: String(nextHal),
      }
    }
  }

  return derivasiPrefillSabqiManzil(fallbackPosisi)
}

export function bangunUrutanHafalan(juzProgress) {
  if (!juzProgress || juzProgress.length === 0) return urutanJuzMundurDari30();
  
  let pola = 'mundur';
  if (juzProgress.length >= 2) {
    if (juzProgress[0] < juzProgress[1]) pola = 'maju';
  } else if (juzProgress.length === 1) {
    if (juzProgress[0] <= 15) pola = 'maju';
  }
  
  const sisaJuz = [];
  const full = pola === 'mundur' ? urutanJuzMundurDari30() : urutanJuzStandar();
  for (const j of full) {
    if (!juzProgress.includes(j)) sisaJuz.push(j);
  }
  
  return [...juzProgress, ...sisaJuz];
}

export function hitungProgresHalaman(urutanHafalan, posisiTerakhir) {
  if (!posisiTerakhir) {
    return { halamanTertempuh: 0, totalHalamanProgram: totalHalamanUrutan(urutanHafalan), persen: 0 };
  }

  const juzSekarang = cariJuzUntukAyat(posisiTerakhir.surahNomor, posisiTerakhir.ayat);
  const idx = urutanHafalan.indexOf(juzSekarang);
  if (idx === -1) {
    throw new Error(`Juz ${juzSekarang} (posisi santri saat ini) tidak ada dalam urutanHafalan.`);
  }

  let halamanTertempuh = 0;
  for (let i = 0; i < idx; i++) {
    const { halamanAwal, halamanAkhir } = getRentangHalamanJuz(urutanHafalan[i]);
    halamanTertempuh += halamanAkhir - halamanAwal + 1;
  }

  const { halamanAwal } = getRentangHalamanJuz(juzSekarang);
  const halamanAbsolutSekarang = cariHalamanAbsolutUntukAyat(posisiTerakhir.surahNomor, posisiTerakhir.ayat);
  halamanTertempuh += halamanAbsolutSekarang - halamanAwal + 1;

  const totalHalamanProgram = totalHalamanUrutan(urutanHafalan);
  return {
    halamanTertempuh,
    totalHalamanProgram,
    persen: Math.round((halamanTertempuh / totalHalamanProgram) * 1000) / 10,
  };
}

export function totalHalamanUrutan(urutanHafalan) {
  return urutanHafalan.reduce((sum, j) => {
    const { halamanAwal, halamanAkhir } = getRentangHalamanJuz(j);
    return sum + (halamanAkhir - halamanAwal + 1);
  }, 0);
}

export function hitungJumlahHalamanDibaca(mulai, selesai) {
  const bagianAkhir = selesai.pecahan > 0 ? selesai.pecahan : 1;
  const jumlah = selesai.halaman - mulai.halaman + bagianAkhir - mulai.pecahan;
  return Math.round(jumlah * 100) / 100;
}

export function bangunPosisiDariAdminInput(juzProgress: number[], batasHafalanJuz?: number | null, batasHafalanSurah?: string | null, batasHafalanAyat?: number | null) {
  const urutanHafalan = bangunUrutanHafalan(juzProgress);
  let posisiTerakhir = null;

  if (batasHafalanJuz !== null && batasHafalanJuz !== undefined &&
      batasHafalanSurah !== null && batasHafalanSurah !== undefined &&
      batasHafalanAyat !== null && batasHafalanAyat !== undefined) {
      
      let surahNomor = 1;
      if (typeof batasHafalanSurah === 'string') {
        const found = SURAH_LIST.find(s => s.nama.toLowerCase() === batasHafalanSurah.toLowerCase());
        surahNomor = found ? found.nomor : parseInt(batasHafalanSurah, 10);
      } else {
        surahNomor = batasHafalanSurah;
      }

      if (!isNaN(surahNomor)) {
          posisiTerakhir = {
             surahNomor,
             ayat: batasHafalanAyat
          };
      }
  } else if (juzProgress && juzProgress.length > 0) {
      posisiTerakhir = getAyatTerakhirJuz(juzProgress[juzProgress.length - 1]);
  }
  
  return { urutanHafalan, posisiTerakhir };
}
export function getValidJuzList(profile: {
  urutanHafalan?: number[] | null,
  juzProgress?: number[] | null,
  posisiTerakhir?: { surahNomor: number, ayat: number } | null,
  juzUjianPending?: number | null
}): number[] {
  if (!profile) return [];
  const urutan = profile.urutanHafalan || urutanJuzStandar();
  let passedJuzList = kalkulasiJuzProgress(profile.urutanHafalan || [], profile.posisiTerakhir, profile.juzUjianPending);
  if (profile.posisiTerakhir) {
    const curJuz = cariJuzUntukAyat(profile.posisiTerakhir.surahNomor, profile.posisiTerakhir.ayat);
    const currentIndex = urutan.indexOf(curJuz);
    if (currentIndex !== -1) {
      for (let i = 0; i <= currentIndex; i++) {
        if (!passedJuzList.includes(urutan[i])) {
          passedJuzList.push(urutan[i]);
        }
      }
    }
  }
  if (passedJuzList.length === 0) return [30];
  return passedJuzList;
}

export function kalkulasiJuzProgress(urutanHafalan: number[], posisiTerakhir: { surahNomor: number, ayat: number } | null, juzUjianPending?: number | null): number[] {
  if (!posisiTerakhir) return [];
  const juzSekarang = cariJuzUntukAyat(posisiTerakhir.surahNomor, posisiTerakhir.ayat);
  const indexJuzSekarang = urutanHafalan.indexOf(juzSekarang);
  if (indexJuzSekarang === -1) return [];
  let completed = urutanHafalan.slice(0, indexJuzSekarang);
  const akhirJuz = getAyatTerakhirJuz(juzSekarang);
  if (posisiTerakhir.surahNomor === akhirJuz.surahNomor && posisiTerakhir.ayat === akhirJuz.ayat) {
    if (juzUjianPending !== juzSekarang) {
      completed.push(juzSekarang);
    }
  }
  // Cegah juzUjianPending masuk Mutqin jika sudah kadung berada di slice sebelumnya (misal data legacy)
  if (juzUjianPending) {
    completed = completed.filter(juz => juz !== juzUjianPending);
  }
  return completed;
}

/**
 * Mengambil dan menampilkan HANYA posisi terakhir (surah & ayat akhir) dari setoran Murojaah (Sabqi/Manzil).
 * Contoh: jika setoran dari Al-Mulk s/d Al-Qalam, maka menampilkan: "Al-Qalam : Ayat 52".
 */
export function formatSetoranPosisiTerakhir(s: any): string {
  if (!s) return '-'

  // 1. Jika ada surahMeta.surahSelesai
  if (s.surahMeta?.surahSelesai?.nama) {
    const { nama, ayat } = s.surahMeta.surahSelesai
    return `${nama} : Ayat ${ayat || 1}`
  }

  // 2. Jika ada surah & ayat langsung
  if (s.surah) {
    const surahNo = typeof s.surah === 'number' ? s.surah : parseInt(s.surah, 10)
    const surahInfo = !isNaN(surahNo) ? surahByNomor[surahNo] : null
    const namaSurah = surahInfo ? surahInfo.nama : (typeof s.surah === 'string' ? s.surah : `Surah ${s.surah}`)
    const ayatPos = s.ayatAkhir || s.ayatAwal || 1
    return `${namaSurah} : Ayat ${ayatPos}`
  }

  // 3. Jika tersimpan sebagai juz & halaman
  const halAwal = s.halamanAwal || 1
  const halAkhir = s.halamanAkhir || halAwal

  // Kasus lintas-juz: gunakan buatSurahMetaLintasJuz agar surahSelesai tepat
  if (s.lintasJuz && s.juzMulai && s.juzSelesai) {
    try {
      const meta = buatSurahMetaLintasJuz(s.juzMulai, halAwal, s.juzSelesai, halAkhir)
      if (meta?.surahSelesai?.nama) {
        return `${meta.surahSelesai.nama} : Ayat ${meta.surahSelesai.ayat}`
      }
    } catch (err) {
      // ignore, fallthrough
    }
  }

  const juzNo = s.juz || s.juzMulai || s.juzSelesai

  if (juzNo) {
    try {
      const meta = buatSurahMeta(juzNo, halAwal, halAkhir)
      if (meta?.surahSelesai?.nama) {
        return `${meta.surahSelesai.nama} : Ayat ${meta.surahSelesai.ayat}`
      }
      if (meta?.label) return meta.label
    } catch (err) {
      // ignore
    }
  }

  // Fallback
  if (juzNo) {
    return `Juz ${juzNo}${halAkhir ? `, Hal. ${halAkhir}` : ''}`
  }

  return '-'
}

export function formatSetoranKeSurahAyat(s: any): string {
  return formatSetoranPosisiTerakhir(s)
}

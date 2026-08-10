/**
 * KALENDER TAQWIM STANDAR INDONESIA KEMENAG RI (1448 H / 2026-2027 M)
 * 
 * File ini menjadi Single Source of Truth (SSOT) referensi tanggal awal bulan Hijriah 
 * berdasarkan Taqwim Standar Indonesia Kemenag RI (Bimas Islam).
 * 
 * Untuk memperbarui tanggal resmi pasca Sidang Isbat Kemenag:
 * Cukup ubah/tambahkan tanggal pada array KEMENAG_HIJRI_MONTHS di bawah ini.
 */

export interface HijriMonthRef {
  yearHijri: number;
  monthHijri: number; // 1 = Muharram, 2 = Safar, dst.
  monthNameHijri: string;
  startDateMasehi: string; // YYYY-MM-DD
  isOfficialIsbat?: boolean; // true jika sudah ditetapkan sidang isbat
}

export const HIJRI_MONTH_NAMES = [
  'Muharram',
  'Shafar',
  'Rabiul Awal',
  'Rabiul Akhir',
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  'Sya\'ban',
  'Ramadhan',
  'Syawal',
  'Dzulqa\'dah',
  'Dzulhijjah'
];

/**
 * Daftar Rujukan Awal Bulan Hijriah 1447 H - 1448 H (Kemenag RI)
 */
export const KEMENAG_HIJRI_MONTHS: HijriMonthRef[] = [
  // 1447 H Sample
  { yearHijri: 1447, monthHijri: 1, monthNameHijri: 'Muharram', startDateMasehi: '2025-06-27', isOfficialIsbat: true },
  { yearHijri: 1447, monthHijri: 9, monthNameHijri: 'Ramadhan', startDateMasehi: '2026-02-18', isOfficialIsbat: true },
  { yearHijri: 1447, monthHijri: 10, monthNameHijri: 'Syawal', startDateMasehi: '2026-03-20', isOfficialIsbat: true },
  { yearHijri: 1447, monthHijri: 12, monthNameHijri: 'Dzulhijjah', startDateMasehi: '2026-05-18', isOfficialIsbat: true },

  // 1448 H (Taqwim Standar Indonesia Kemenag RI 2026 - 2027)
  { yearHijri: 1448, monthHijri: 1, monthNameHijri: 'Muharram', startDateMasehi: '2026-06-16', isOfficialIsbat: true },
  { yearHijri: 1448, monthHijri: 2, monthNameHijri: 'Shafar', startDateMasehi: '2026-07-16', isOfficialIsbat: true },
  { yearHijri: 1448, monthHijri: 3, monthNameHijri: 'Rabiul Awal', startDateMasehi: '2026-08-14', isOfficialIsbat: false },
  { yearHijri: 1448, monthHijri: 4, monthNameHijri: 'Rabiul Akhir', startDateMasehi: '2026-09-12', isOfficialIsbat: false },
  { yearHijri: 1448, monthHijri: 5, monthNameHijri: 'Jumadil Awal', startDateMasehi: '2026-10-12', isOfficialIsbat: false },
  { yearHijri: 1448, monthHijri: 6, monthNameHijri: 'Jumadil Akhir', startDateMasehi: '2026-11-11', isOfficialIsbat: false },
  { yearHijri: 1448, monthHijri: 7, monthNameHijri: 'Rajab', startDateMasehi: '2026-12-10', isOfficialIsbat: false },
  { yearHijri: 1448, monthHijri: 8, monthNameHijri: 'Sya\'ban', startDateMasehi: '2027-01-09', isOfficialIsbat: false },
  { yearHijri: 1448, monthHijri: 9, monthNameHijri: 'Ramadhan', startDateMasehi: '2027-02-08', isOfficialIsbat: false },
  { yearHijri: 1448, monthHijri: 10, monthNameHijri: 'Syawal', startDateMasehi: '2027-03-10', isOfficialIsbat: false },
  { yearHijri: 1448, monthHijri: 11, monthNameHijri: 'Dzulqa\'dah', startDateMasehi: '2027-04-08', isOfficialIsbat: false },
  { yearHijri: 1448, monthHijri: 12, monthNameHijri: 'Dzulhijjah', startDateMasehi: '2027-05-07', isOfficialIsbat: false }
];

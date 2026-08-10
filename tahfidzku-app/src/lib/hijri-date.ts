import { KEMENAG_HIJRI_MONTHS, HIJRI_MONTH_NAMES } from '../config/hijri-kemenag.config';
import type { HijriMonthRef } from '../config/hijri-kemenag.config';

export interface HijriDateResult {
  day: number;
  month: number;
  monthName: string;
  year: number;
  isEstimated: boolean;
  formattedHijri: string;
}

/**
 * Konversi tanggal Masehi ke Hijriah berdasarkan Taqwim Kemenag RI
 */
export function getHijriDate(inputDate: Date | string = new Date()): HijriDateResult {
  const d = typeof inputDate === 'string' ? new Date(inputDate) : new Date(inputDate);
  
  // Format YYYY-MM-DD dalam timezone Asia/Jakarta
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const targetTime = new Date(dateStr + 'T00:00:00+07:00').getTime();

  // Urutkan rujukan bulan dari terlama ke terbaru
  const sortedRefs = [...KEMENAG_HIJRI_MONTHS].sort((a, b) => 
    new Date(a.startDateMasehi + 'T00:00:00+07:00').getTime() - new Date(b.startDateMasehi + 'T00:00:00+07:00').getTime()
  );

  // Cari referensi bulan yang mencakup tanggal target
  let matchedRef: HijriMonthRef | null = null;
  let nextRefDate: number | null = null;

  for (let i = 0; i < sortedRefs.length; i++) {
    const currentRefTime = new Date(sortedRefs[i].startDateMasehi + 'T00:00:00+07:00').getTime();
    const nextRefTime = i < sortedRefs.length - 1 
      ? new Date(sortedRefs[i + 1].startDateMasehi + 'T00:00:00+07:00').getTime()
      : null;

    if (targetTime >= currentRefTime && (nextRefTime === null || targetTime < nextRefTime)) {
      matchedRef = sortedRefs[i];
      nextRefDate = nextRefTime;
      break;
    }
  }

  if (matchedRef) {
    const refTime = new Date(matchedRef.startDateMasehi + 'T00:00:00+07:00').getTime();
    const diffDays = Math.floor((targetTime - refTime) / (1000 * 60 * 60 * 24));
    const day = diffDays + 1;

    return {
      day,
      month: matchedRef.monthHijri,
      monthName: matchedRef.monthNameHijri,
      year: matchedRef.yearHijri,
      isEstimated: false,
      formattedHijri: `${day} ${matchedRef.monthNameHijri} ${matchedRef.yearHijri} H`
    };
  }

  // FALLBACK: Jika tanggal di luar cakupan tabel rujukan Kemenag RI, gunakan estimasi hisab dengan marker `*`
  try {
    const parts = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).formatToParts(d);

    let day = 1;
    let monthName = '';
    let year = 1448;

    for (const p of parts) {
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'month') monthName = p.value;
      if (p.type === 'year') year = parseInt(p.value, 10);
    }

    return {
      day,
      month: 1,
      monthName: monthName || 'Hijriah',
      year,
      isEstimated: true,
      formattedHijri: `${day} ${monthName} ${year} H*`
    };
  } catch (err) {
    // Basic fallback if Intl is not available
    return {
      day: 1,
      month: 1,
      monthName: 'Hijriah',
      year: 1448,
      isEstimated: true,
      formattedHijri: `1448 H*`
    };
  }
}

/**
 * Format tanggal Masehi + Hijriah berdampingan
 * Contoh Output: "10 Agustus 2026 / 25 Shafar 1448 H"
 */
export function formatDateWithHijri(
  inputDate: Date | string = new Date(),
  options?: { short?: boolean; includeWeekday?: boolean }
): string {
  const d = typeof inputDate === 'string' ? new Date(inputDate) : new Date(inputDate);
  if (isNaN(d.getTime())) return '-';

  const monthFormat = options?.short ? 'short' : 'long';
  
  const masehiFormatted = d.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    ...(options?.includeWeekday ? { weekday: options.short ? 'short' : 'long' } : {}),
    day: 'numeric',
    month: monthFormat,
    year: 'numeric'
  });

  const hijri = getHijriDate(d);
  
  return `${masehiFormatted} / ${hijri.formattedHijri}`;
}

/**
 * PERHATIAN: Fungsi ini sengaja mereplikasi bug toISOString() dari cron Ticket 1
 * (tengah malam WIB dikonversi ke UTC, hasilnya mundur 1 hari / menghasilkan Minggu, bukan Senin).
 * WAJIB dipakai di semua tempat yang perlu mencocokkan `mingguMulai` tersimpan,
 * sampai bug akar ini diperbaiki + data historis di-backfill (lihat isu terpisah).
 */
export function getLegacyMingguMulaiKey(date: Date = new Date()): string {
  const startOfWeek = new Date(date)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)
  return startOfWeek.toISOString().split('T')[0]
}

/**
 * Mendapatkan tanggal hari ini dalam zona waktu WIB (Asia/Jakarta).
 * Mengembalikan string dalam format YYYY-MM-DD.
 */
export function getTodayWIB(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

/**
 * Parsing aman untuk format YYYY-MM-DD (menghindari UTC shift menjadi hari sebelumnya)
 * String akan ditambahkan time T12:00:00 untuk memastikan berada di tengah hari,
 * sehingga aman saat diformat ulang ke string lokal.
 */
export function parseDateString(dateStr: string | Date | null | undefined): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // Jika formatnya hanya YYYY-MM-DD, tambahkan noon time
  if (dateStr.length === 10 && dateStr.indexOf('-') === 4) {
    return new Date(`${dateStr}T12:00:00`);
  }
  return new Date(dateStr);
}

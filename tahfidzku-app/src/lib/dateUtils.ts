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

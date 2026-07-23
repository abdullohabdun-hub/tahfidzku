// src/lib/penilaian.ts
// Konstanta tunggal sistem penilaian standar Tahfidzku
// Sumber kebenaran untuk seluruh aplikasi — jangan duplikasi di tempat lain

export const SKOR_LIST = [5, 4, 3, 2, 1] as const
export type SkorKualitas = 1 | 2 | 3 | 4 | 5
export type StatusHafalan = 'lanjut' | 'mengulang'

// Label default — dipakai jika lembaga belum mengatur label kustom
export const SKOR_DEFAULT_LABELS: Record<SkorKualitas, string> = {
  5: 'Mumtaz',
  4: 'Jayyid Jiddan',
  3: 'Jayyid',
  2: "Da'if",
  1: "Da'if Jiddan",
}

// Warna badge per skor
export const SKOR_WARNA: Record<SkorKualitas, string> = {
  5: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  4: 'text-teal-700 bg-teal-100 border-teal-200',
  3: 'text-amber-700 bg-amber-100 border-amber-200',
  2: 'text-orange-700 bg-orange-100 border-orange-200',
  1: 'text-red-700 bg-red-100 border-red-200',
}

// Warna solid untuk tombol yang dipilih
export const SKOR_WARNA_SOLID: Record<SkorKualitas, string> = {
  5: 'bg-emerald-600 text-white border-emerald-600',
  4: 'bg-teal-600 text-white border-teal-600',
  3: 'bg-amber-500 text-white border-amber-500',
  2: 'bg-orange-500 text-white border-orange-500',
  1: 'bg-red-600 text-white border-red-600',
}

// Konversi data lama (kualitas enum) → skor angka
export const LEGACY_TO_SKOR: Record<string, SkorKualitas> = {
  lancar: 3,
  mengulang: 2,
  terbata: 1,
}

/**
 * Ambil label skor dengan fallback ke default.
 * @param skor - angka 1-5
 * @param labelKustom - dari rapor_settings.label_penilaian (opsional)
 */
export function getLabelSkor(
  skor: number | null | undefined,
  labelKustom?: Record<string, string> | null
): string {
  if (!skor || skor < 1 || skor > 5) return '-'
  return labelKustom?.[`skor${skor}`] || SKOR_DEFAULT_LABELS[skor as SkorKualitas] || String(skor)
}

/**
 * Ambil kelas CSS warna badge untuk skor tertentu.
 */
export function getWarnaSkor(skor: number | null | undefined): string {
  if (!skor || skor < 1 || skor > 5) return 'text-slate-500 bg-slate-100 border-slate-200'
  return SKOR_WARNA[skor as SkorKualitas]
}

/**
 * Untuk data backward-compat: ambil skor efektif dari setoran
 * (gunakan skor_kualitas jika ada, konversi kualitas lama jika tidak).
 */
export function getSkorEfektif(item: {
  skorKualitas?: number | null
  kualitas?: string | null
}): SkorKualitas | null {
  if (item.skorKualitas && item.skorKualitas >= 1 && item.skorKualitas <= 5) {
    return item.skorKualitas as SkorKualitas
  }
  if (item.kualitas) {
    return LEGACY_TO_SKOR[item.kualitas.toLowerCase()] ?? null
  }
  return null
}

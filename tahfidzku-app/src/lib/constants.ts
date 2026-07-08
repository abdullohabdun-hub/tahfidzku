// src/lib/constants.ts
// Konstanta dan enum yang digunakan di seluruh aplikasi

export const ROLES = ['admin', 'ustadz', 'santri', 'wali'] as const
export type Role = (typeof ROLES)[number]

export const JENIS_SETORAN = ['ziyadah', 'sabqi', 'manzil'] as const
export type JenisSetoran = (typeof JENIS_SETORAN)[number]

export const KUALITAS_BACAAN = ['lancar', 'mengulang', 'terbata'] as const
export type KualitasBacaan = (typeof KUALITAS_BACAAN)[number]

// Label bahasa Indonesia untuk tampilan frontend
export const JENIS_SETORAN_LABEL: Record<JenisSetoran, string> = {
  ziyadah: 'Ziyadah (Hafalan Baru)',
  sabqi: 'Sabqi (Hafalan Kemarin)',
  manzil: 'Manzil (Hafalan Lama)',
}

export const KUALITAS_LABEL: Record<KualitasBacaan, string> = {
  lancar: 'Lancar',
  mengulang: 'Masih Mengulang',
  terbata: 'Terbata-bata',
}

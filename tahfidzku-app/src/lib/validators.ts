// src/lib/validators.ts
// Shared Zod schemas — dipakai oleh server functions DAN frontend forms

import { z } from 'zod'

// ── Setoran (Input oleh Ustadz) ──────────────────────
export const createSetoranSchema = z
  .object({
    santriId: z.string().uuid('ID Santri tidak valid'),
    jenis: z.enum(['ziyadah', 'sabqi', 'manzil'], {
      errorMap: () => ({ message: 'Jenis setoran harus: ziyadah, sabqi, atau manzil' }),
    }),
    surah: z
      .string()
      .min(1, 'Nama surah wajib diisi')
      .max(50, 'Nama surah terlalu panjang'),
    ayatAwal: z
      .number({ invalid_type_error: 'Ayat awal harus berupa angka' })
      .int('Ayat awal harus bilangan bulat')
      .positive('Ayat awal harus positif')
      .max(286, 'Ayat awal maksimal 286'),
    ayatAkhir: z
      .number({ invalid_type_error: 'Ayat akhir harus berupa angka' })
      .int('Ayat akhir harus bilangan bulat')
      .positive('Ayat akhir harus positif')
      .max(286, 'Ayat akhir maksimal 286'),
    kualitas: z.enum(['lancar', 'mengulang', 'terbata'], {
      errorMap: () => ({ message: 'Kualitas harus: lancar, mengulang, atau terbata' }),
    }),
    catatan: z
      .string()
      .max(500, 'Catatan maksimal 500 karakter')
      .optional(),
  })
  .refine((data) => data.ayatAkhir >= data.ayatAwal, {
    message: 'Ayat akhir tidak boleh kurang dari ayat awal',
    path: ['ayatAkhir'],
  })

export type CreateSetoranInput = z.infer<typeof createSetoranSchema>

// ── Update Setoran ───────────────────────────────────
export const updateSetoranSchema = createSetoranSchema.extend({
  id: z.string().uuid('ID Setoran tidak valid'),
})

export type UpdateSetoranInput = z.infer<typeof updateSetoranSchema>

// ── Laporan Mandiri (Input oleh Santri Dewasa) ───────
export const createLaporanSchema = z
  .object({
    jenis: z.enum(['ziyadah', 'sabqi', 'manzil'], {
      errorMap: () => ({ message: 'Jenis setoran harus: ziyadah, sabqi, atau manzil' }),
    }),
    surah: z
      .string()
      .min(1, 'Nama surah wajib diisi')
      .max(50, 'Nama surah terlalu panjang'),
    ayatAwal: z
      .number({ invalid_type_error: 'Ayat awal harus berupa angka' })
      .int()
      .positive()
      .max(286),
    ayatAkhir: z
      .number({ invalid_type_error: 'Ayat akhir harus berupa angka' })
      .int()
      .positive()
      .max(286),
    kualitasMandiri: z.enum(['lancar', 'mengulang', 'terbata'], {
      errorMap: () => ({ message: 'Kualitas harus: lancar, mengulang, atau terbata' }),
    }),
    catatan: z
      .string()
      .max(500, 'Catatan maksimal 500 karakter')
      .optional(),
  })
  .refine((data) => data.ayatAkhir >= data.ayatAwal, {
    message: 'Ayat akhir tidak boleh kurang dari ayat awal',
    path: ['ayatAkhir'],
  })

export type CreateLaporanInput = z.infer<typeof createLaporanSchema>

// ── Auth ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(4, 'PIN/Password minimal 4 karakter'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerTenantSchema = z.object({
  namaLembaga: z
    .string()
    .min(3, 'Nama lembaga minimal 3 karakter')
    .max(255, 'Nama lembaga terlalu panjang'),
  nama: z
    .string()
    .min(2, 'Nama admin minimal 2 karakter')
    .max(255),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

export type RegisterTenantInput = z.infer<typeof registerTenantSchema>

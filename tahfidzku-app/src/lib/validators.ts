// src/lib/validators.ts
// Shared Zod schemas — dipakai oleh server functions DAN frontend forms

import { z } from 'zod'

// ── Setoran (Input oleh Ustadz) ──────────────────────
export const createSetoranSchema = z
  .object({
    santriId: z.string().uuid('ID Santri tidak valid'),
    jenis: z.enum(['ziyadah', 'sabqi', 'manzil'], {
      message: 'Jenis setoran harus: ziyadah, sabqi, atau manzil',
    }),
    juz: z.number({ message: 'Juz harus berupa angka' }).int().positive().max(30, 'Juz maksimal 30').optional(),
    juzMulai: z.number({ message: 'Juz mulai harus berupa angka' }).int().positive().max(30).optional(),
    juzSelesai: z.number({ message: 'Juz selesai harus berupa angka' }).int().positive().max(30).optional(),
    lintasJuz: z.boolean().optional(),
    halamanAwal: z.number().positive().max(604).optional(),
    halamanAkhir: z.number().positive().max(604).optional(),
    surah: z
      .string()
      .max(100, 'Nama surah terlalu panjang')
      .optional(),
    surahNomor: z.number().int().positive().max(114).optional(),
    surahMeta: z.record(z.string(), z.any()).optional(),
    ayatAwal: z
      .number({ message: 'Ayat awal harus berupa angka' })
      .int()
      .positive()
      .max(286)
      .optional(),
    ayatAkhir: z.number().int().min(1).max(286).optional().nullable(),
    kualitas: z.enum(['lancar', 'mengulang', 'terbata']).optional().nullable(),
    penilaianKustom: z.record(z.string(), z.any()).optional().nullable(),
    catatan: z.string().max(500, { message: 'Catatan maksimal 500 karakter' }).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.jenis === 'ziyadah') {
      if (!data.surah) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Surah wajib diisi untuk Ziyadah', path: ['surah'] });
      if (!data.surahNomor) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nomor Surah wajib diisi untuk Ziyadah', path: ['surahNomor'] });
      if (!data.ayatAwal) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ayat awal wajib diisi untuk Ziyadah', path: ['ayatAwal'] });
      if (!data.ayatAkhir) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ayat akhir wajib diisi untuk Ziyadah', path: ['ayatAkhir'] });
      if (data.ayatAwal && data.ayatAkhir && data.ayatAkhir < data.ayatAwal) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ayat akhir tidak boleh kurang dari ayat awal', path: ['ayatAkhir'] });
      }
    } else {
      if (!data.juzMulai) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Juz wajib diisi untuk Sabqi/Manzil', path: ['juzMulai'] });
      if (!data.halamanAwal) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Halaman awal wajib diisi untuk Sabqi/Manzil', path: ['halamanAwal'] });
      if (!data.halamanAkhir) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Halaman akhir wajib diisi untuk Sabqi/Manzil', path: ['halamanAkhir'] });
      if (data.halamanAwal && data.halamanAkhir && data.halamanAkhir < data.halamanAwal) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Halaman akhir tidak boleh kurang dari halaman awal', path: ['halamanAkhir'] });
      }
    }
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
      message: 'Jenis setoran harus: ziyadah, sabqi, atau manzil',
    }),
    surah: z
      .string()
      .min(1, 'Nama surah wajib diisi')
      .max(50, 'Nama surah terlalu panjang'),
    ayatAwal: z
      .number({ message: 'Ayat awal harus berupa angka' })
      .int()
      .positive()
      .max(286),
    ayatAkhir: z
      .number({ message: 'Ayat akhir harus berupa angka' })
      .int()
      .positive()
      .max(286),
    kualitasMandiri: z.enum(['lancar', 'mengulang', 'terbata'], {
      message: 'Kualitas harus: lancar, mengulang, atau terbata',
    }).optional().nullable(),
    penilaianKustom: z.record(z.string(), z.any()).optional().nullable(),
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

export const updateSetoranSantriSchema = createLaporanSchema.extend({
  id: z.string().uuid('ID Setoran tidak valid'),
})
export type UpdateSetoranSantriInput = z.infer<typeof updateSetoranSantriSchema>

// ── Auth ─────────────────────────────────────────────
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Username / No WA / Email wajib diisi'),
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

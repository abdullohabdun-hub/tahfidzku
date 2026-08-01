import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { kelas, sesiKelas, users } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError } from '../lib/errors'
import { WAKTU_SHALAT_OPTIONS } from '../lib/constants'

// ==========================================
// KELAS CRUD (ADMIN ONLY)
// ==========================================

export const getKelasList = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const kelasList = await db
        .select({
          id: kelas.id,
          nama: kelas.nama,
          ustadzId: kelas.ustadzId,
          ustadzNama: users.nama,
          tipeKelas: kelas.tipeKelas,
          waktuShalatDiizinkan: kelas.waktuShalatDiizinkan,
          hariPertemuan: kelas.hariPertemuan,
          jamMulai: kelas.jamMulai,
          jamSelesai: kelas.jamSelesai,
          absensiCount: sql<number>`count(${sesiKelas.id})::int`,
        })
        .from(kelas)
        .leftJoin(users, eq(kelas.ustadzId, users.id))
        .leftJoin(sesiKelas, eq(kelas.id, sesiKelas.kelasId))
        .where(eq(kelas.tenantId, session.user.tenantId))
        .groupBy(kelas.id, users.nama)
        .orderBy(desc(kelas.createdAt))

      return success(kelasList, 'Berhasil mengambil daftar kelas')
    } catch (err) {
      return handleError(err)
    }
  }
)

export const createKelas = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.discriminatedUnion('tipeKelas', [
    z.object({
      tipeKelas: z.literal('online'),
      nama: z.string().min(1, 'Nama kelas wajib diisi'),
      ustadzId: z.string().uuid().optional().nullable(),
      hariPertemuan: z.array(z.enum(['senin','selasa','rabu','kamis','jumat','sabtu','minggu'])).min(1, 'Minimal pilih satu hari'),
      jamMulai: z.string().regex(/^\d{2}:\d{2}$/),
      jamSelesai: z.string().regex(/^\d{2}:\d{2}$/),
      waktuShalatDiizinkan: z.null().optional(),
    }).refine(d => d.jamSelesai > d.jamMulai, { message: 'Jam selesai harus lebih akhir dari jam mulai', path: ['jamSelesai'] }),
    z.object({
      tipeKelas: z.literal('reguler_non_mukim'),
      nama: z.string().min(1, 'Nama kelas wajib diisi'),
      ustadzId: z.string().uuid().optional().nullable(),
      hariPertemuan: z.array(z.enum(['senin','selasa','rabu','kamis','jumat','sabtu','minggu'])).min(1, 'Minimal pilih satu hari'),
      jamMulai: z.string().regex(/^\d{2}:\d{2}$/),
      jamSelesai: z.string().regex(/^\d{2}:\d{2}$/),
      waktuShalatDiizinkan: z.null().optional(),
    }).refine(d => d.jamSelesai > d.jamMulai, { message: 'Jam selesai harus lebih akhir dari jam mulai', path: ['jamSelesai'] }),
    z.object({
      tipeKelas: z.literal('reguler'),
      nama: z.string().min(1, 'Nama kelas wajib diisi'),
      ustadzId: z.string().uuid().optional().nullable(),
      hariPertemuan: z.array(z.enum(['senin','selasa','rabu','kamis','jumat','sabtu','minggu'])).optional(),
      jamMulai: z.string().optional().nullable(),
      jamSelesai: z.string().optional().nullable(),
      waktuShalatDiizinkan: z.array(z.enum(WAKTU_SHALAT_OPTIONS)).optional(),
    }),
  ]).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const newKelas = await db.insert(kelas).values({
        tenantId: session.user.tenantId,
        nama: data.nama,
        ustadzId: data.ustadzId || null,
        tipeKelas: data.tipeKelas,
        hariPertemuan: (data.tipeKelas === 'online' || data.tipeKelas === 'reguler_non_mukim') ? data.hariPertemuan : [],
        jamMulai: (data.tipeKelas === 'online' || data.tipeKelas === 'reguler_non_mukim') ? data.jamMulai : null,
        jamSelesai: (data.tipeKelas === 'online' || data.tipeKelas === 'reguler_non_mukim') ? data.jamSelesai : null,
        waktuShalatDiizinkan: data.tipeKelas === 'reguler'
          ? (data.waktuShalatDiizinkan?.length ? data.waktuShalatDiizinkan : null)
          : null,
      }).returning({ id: kelas.id, nama: kelas.nama })

      return success(newKelas[0], 'Berhasil membuat Kelas/Halaqoh')
    } catch (err) {
      return handleError(err)
    }
  })

export const deleteKelas = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      await db.delete(kelas).where(and(eq(kelas.id, data.id), eq(kelas.tenantId, session.user.tenantId)))
      return success(null, 'Berhasil menghapus Kelas/Halaqoh')
    } catch (err) {
      return handleError(err)
    }
  })

export const updateKelas = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.discriminatedUnion('tipeKelas', [
    z.object({
      id: z.string(),
      tipeKelas: z.literal('online'),
      nama: z.string().min(1, 'Nama kelas wajib diisi'),
      ustadzId: z.string().uuid().optional().nullable(),
      hariPertemuan: z.array(z.enum(['senin','selasa','rabu','kamis','jumat','sabtu','minggu'])).min(1, 'Minimal pilih satu hari'),
      jamMulai: z.string().regex(/^\d{2}:\d{2}$/),
      jamSelesai: z.string().regex(/^\d{2}:\d{2}$/),
      waktuShalatDiizinkan: z.null().optional(),
    }).refine(d => d.jamSelesai > d.jamMulai, { message: 'Jam selesai harus lebih akhir dari jam mulai', path: ['jamSelesai'] }),
    z.object({
      id: z.string(),
      tipeKelas: z.literal('reguler_non_mukim'),
      nama: z.string().min(1, 'Nama kelas wajib diisi'),
      ustadzId: z.string().uuid().optional().nullable(),
      hariPertemuan: z.array(z.enum(['senin','selasa','rabu','kamis','jumat','sabtu','minggu'])).min(1, 'Minimal pilih satu hari'),
      jamMulai: z.string().regex(/^\d{2}:\d{2}$/),
      jamSelesai: z.string().regex(/^\d{2}:\d{2}$/),
      waktuShalatDiizinkan: z.null().optional(),
    }).refine(d => d.jamSelesai > d.jamMulai, { message: 'Jam selesai harus lebih akhir dari jam mulai', path: ['jamSelesai'] }),
    z.object({
      id: z.string(),
      tipeKelas: z.literal('reguler'),
      nama: z.string().min(1, 'Nama kelas wajib diisi'),
      ustadzId: z.string().uuid().optional().nullable(),
      hariPertemuan: z.array(z.enum(['senin','selasa','rabu','kamis','jumat','sabtu','minggu'])).optional(),
      jamMulai: z.string().optional().nullable(),
      jamSelesai: z.string().optional().nullable(),
      waktuShalatDiizinkan: z.array(z.enum(WAKTU_SHALAT_OPTIONS)).optional(),
    }),
  ]).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // Cek absensi history
      const sesi = await db.select({ count: sql<number>`count(${sesiKelas.id})` }).from(sesiKelas).where(eq(sesiKelas.kelasId, data.id))
      const hasAbsensiHistory = sesi[0].count > 0;

      await db.update(kelas).set({
        nama: data.nama,
        ustadzId: data.ustadzId || null,
        tipeKelas: data.tipeKelas,
        hariPertemuan: (data.tipeKelas === 'online' || data.tipeKelas === 'reguler_non_mukim') ? data.hariPertemuan : [],
        jamMulai: (data.tipeKelas === 'online' || data.tipeKelas === 'reguler_non_mukim') ? data.jamMulai : null,
        jamSelesai: (data.tipeKelas === 'online' || data.tipeKelas === 'reguler_non_mukim') ? data.jamSelesai : null,
        waktuShalatDiizinkan: data.tipeKelas === 'reguler'
          ? (data.waktuShalatDiizinkan?.length ? data.waktuShalatDiizinkan : null)
          : null,
      }).where(and(eq(kelas.id, data.id), eq(kelas.tenantId, session.user.tenantId)))

      return success({ hasAbsensiHistory }, 'Berhasil menyimpan Kelas/Halaqoh')
    } catch (err) {
      return handleError(err)
    }
  })

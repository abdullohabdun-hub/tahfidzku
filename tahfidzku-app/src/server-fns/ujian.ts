// src/server-fns/ujian.ts
// Server functions untuk Ujian Kenaikan Juz

import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { ujian, ujianIqra, santri, kelas, users } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ForbiddenError, ValidationError } from '../lib/errors'
import { hitungSkorUjian } from '../lib/ujianLogic'

// ── Zod Validators ──────────────────────────────────────────
const createUjianSchema = z.object({
  santriId:   z.string().uuid(),
  juz:        z.number().int().min(1).max(30),
  kelancaran: z.enum(['lancar', 'mengulang', 'terbata']),
  tajwid:     z.enum(['sempurna', 'cukup', 'kurang']),
  status:     z.enum(['lulus', 'tidak_lulus']), // Keputusan final ustadz
  cakupanMateri: z.string().max(250).optional(),
  catatan:    z.string().max(500).optional(),
})

const getSantriUjianSchema = z.object({
  santriId: z.string().uuid(),
})

// ══════════════════════════════════════════════════════════
// 1. SUBMIT HASIL UJIAN (USTADZ)
// ══════════════════════════════════════════════════════════
export const createUjian = createServerFn({ method: 'POST' })
  .validator(createUjianSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId

      // 1. Validasi santri ada & milik tenant ini
      const [targetSantri] = await db
        .select({
          id:              santri.id,
          kelasId:         santri.kelasId,
          juzUjianPending: santri.juzUjianPending,
          urutanHafalan:   santri.urutanHafalan,
        })
        .from(santri)
        .where(and(eq(santri.id, data.santriId), eq(santri.tenantId, tenantId)))
        .limit(1)

      if (!targetSantri) throw new ValidationError('Santri tidak ditemukan')

      // 2. Validasi ustadz adalah pengampu kelas santri ini
      if (targetSantri.kelasId) {
        const [kelasSantri] = await db
          .select({ ustadzId: kelas.ustadzId })
          .from(kelas)
          .where(eq(kelas.id, targetSantri.kelasId))
          .limit(1)

        if (!kelasSantri || kelasSantri.ustadzId !== session.user.id) {
          throw new ForbiddenError('Anda bukan pengampu kelas santri ini')
        }
      }

      // 3. Validasi juz yang diujikan = juz yang sedang pending
      if (targetSantri.juzUjianPending !== data.juz) {
        throw new ValidationError(
          `Juz yang diujikan (${data.juz}) tidak sesuai dengan juz yang sedang menunggu ujian ` +
          `(${targetSantri.juzUjianPending ?? 'tidak ada'})`
        )
      }

      // 4. Hitung attempt (percobaan ke berapa)
      const sebelumnya = await db
        .select({ id: ujian.id })
        .from(ujian)
        .where(and(
          eq(ujian.santriId, data.santriId),
          eq(ujian.juz, data.juz),
          eq(ujian.tenantId, tenantId)
        ))
      const attempt = sebelumnya.length + 1

      // 5. Tampilkan warning jika sudah >= 3x gagal (Opsi B: warning saja, tidak blokir)
      // (warning ditangani di UI, tidak perlu blokir di backend)

      // 6. Hitung skor referensi
      const skor = hitungSkorUjian(data.kelancaran, data.tajwid)

      // 7. Insert hasil ujian
      const [newUjian] = await db
        .insert(ujian)
        .values({
          tenantId,
          santriId:   data.santriId,
          ustadzId:   session.user.id,
          juz:        data.juz,
          kelancaran: data.kelancaran,
          tajwid:     data.tajwid,
          skor,
          status:     data.status,
          cakupanMateri: data.cakupanMateri ?? null,
          catatan:    data.catatan ?? null,
          attempt,
        })
        .returning()

      // 8. Update santri berdasarkan hasil
      if (data.status === 'lulus') {
        // Lulus: hapus ujian pending. juzProgress akan otomatis di-derive dari posisiTerakhir.
        await db
          .update(santri)
          .set({ juzUjianPending: null })
          .where(eq(santri.id, data.santriId))
      }
      // Jika tidak lulus: juzUjianPending tetap, Ziyadah masih terblokir

      return success(newUjian, data.status === 'lulus'
        ? `Selamat! Santri dinyatakan LULUS Ujian Kenaikan Juz ${data.juz}.`
        : `Santri BELUM LULUS Ujian Kenaikan Juz ${data.juz}. Perlu latihan lebih lanjut.`
      )
    } catch (err) {
      return handleError(err)
    }
  })

// ══════════════════════════════════════════════════════════
// 2. GET UJIAN PENDING DI KELAS USTADZ (untuk badge notif)
// ══════════════════════════════════════════════════════════
export const getUjianPending = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    const session = await getAuthSession()
    if (!session) throw new AuthenticationError()
    requireRole(session, 'ustadz')

    const tenantId = session.user.tenantId

    // Santri yang punya juzUjianPending di kelas ustadz ini
    const kelasList = await db
      .select({ id: kelas.id })
      .from(kelas)
      .where(and(eq(kelas.ustadzId, session.user.id), eq(kelas.tenantId, tenantId)))

    const kelasIds = kelasList.map(k => k.id)
    if (kelasIds.length === 0) return success([], 'Tidak ada santri pending ujian')

    const { inArray, isNotNull, sql } = await import('drizzle-orm')

    const pending = await db
      .select({
        santriId:        santri.id,
        santriNama:      santri.nama,
        juzUjianPending: santri.juzUjianPending,
        kelasId:         santri.kelasId,
      })
      .from(santri)
      .where(and(
        eq(santri.tenantId, tenantId),
        inArray(santri.kelasId, kelasIds),
        isNotNull(santri.juzUjianPending)
      ))

    // Hitung berapa kali sudah gagal untuk setiap santri (1 query aggregate GROUP BY)
    let withAttempts: Array<{ santriId: string; santriNama: string; juzUjianPending: number | null; kelasId: string | null; gagalCount: number; warningGagal: boolean }> = []
    if (pending.length > 0) {
      const santriIds = pending.map(p => p.santriId)
      const gagalCounts = await db
        .select({
          santriId: ujian.santriId,
          juz: ujian.juz,
          gagalCount: sql<number>`cast(count(*) filter (where ${ujian.status} = 'tidak_lulus') as integer)`
        })
        .from(ujian)
        .where(and(
          eq(ujian.tenantId, tenantId),
          inArray(ujian.santriId, santriIds)
        ))
        .groupBy(ujian.santriId, ujian.juz)

      const gagalMap = new Map<string, number>()
      for (const row of gagalCounts) {
        gagalMap.set(`${row.santriId}:${row.juz}`, Number(row.gagalCount))
      }

      withAttempts = pending.map((s) => {
        const gagalCount = gagalMap.get(`${s.santriId}:${s.juzUjianPending}`) || 0
        return { ...s, gagalCount, warningGagal: gagalCount >= 3 }
      })
    }

    // Query Iqra pending: santri yang punya jilidIqraUjianPending di kelas ustadz ini
    const pendingIqraRaw = await db
      .select({
        santriId:              santri.id,
        santriNama:            santri.nama,
        jilidIqraUjianPending: santri.jilidIqraUjianPending,
        kelasId:               santri.kelasId,
      })
      .from(santri)
      .where(and(
        eq(santri.tenantId, tenantId),
        inArray(santri.kelasId, kelasIds),
        isNotNull(santri.jilidIqraUjianPending)
      ))

    // Hitung berapa kali sudah gagal untuk setiap santri Iqra (1 query aggregate GROUP BY)
    let pendingIqra: Array<{ santriId: string; santriNama: string; jilidIqraUjianPending: number | null; kelasId: string | null; gagalCount: number; warningGagal: boolean }> = []
    if (pendingIqraRaw.length > 0) {
      const santriIqraIds = pendingIqraRaw.map(p => p.santriId)
      const gagalIqraCounts = await db
        .select({
          santriId: ujianIqra.santriId,
          jilidDiuji: ujianIqra.jilidDiuji,
          gagalCount: sql<number>`cast(count(*) filter (where ${ujianIqra.lulus} = false) as integer)`
        })
        .from(ujianIqra)
        .where(and(
          eq(ujianIqra.tenantId, tenantId),
          inArray(ujianIqra.santriId, santriIqraIds)
        ))
        .groupBy(ujianIqra.santriId, ujianIqra.jilidDiuji)

      const gagalIqraMap = new Map<string, number>()
      for (const row of gagalIqraCounts) {
        gagalIqraMap.set(`${row.santriId}:${row.jilidDiuji}`, Number(row.gagalCount))
      }

      pendingIqra = pendingIqraRaw.map((s) => {
        const gagalCount = gagalIqraMap.get(`${s.santriId}:${s.jilidIqraUjianPending}`) || 0
        return { ...s, gagalCount, warningGagal: gagalCount >= 3 }
      })
    }

    return success(
      { pendingTahfidz: withAttempts, pendingIqra },
      'Data ujian pending berhasil diambil'
    )
  } catch (err) {
    return handleError(err)
  }
})

// ══════════════════════════════════════════════════════════
// 3. GET RIWAYAT UJIAN (USTADZ / ADMIN)
// ══════════════════════════════════════════════════════════
export const getUjianList = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    const session = await getAuthSession()
    if (!session) throw new AuthenticationError()
    if (session.user.role !== 'ustadz' && session.user.role !== 'admin') {
      throw new AuthenticationError('Akses ditolak')
    }

    const tenantId = session.user.tenantId

    const results = await db.query.ujian.findMany({
      where: eq(ujian.tenantId, tenantId),
      orderBy: [desc(ujian.createdAt)],
      limit: 100,
      with: {
        santri: { columns: { nama: true } },
        ustadz: { columns: { nama: true } },
      }
    })

    const mapped = results.map(u => ({
      ...u,
      santriNama: u.santri.nama,
      ustadzNama: u.ustadz.nama,
    }))

    return success(mapped, 'Riwayat ujian berhasil diambil')
  } catch (err) {
    return handleError(err)
  }
})

// ══════════════════════════════════════════════════════════
// 4. GET RIWAYAT UJIAN PER SANTRI (Semua role)
// ══════════════════════════════════════════════════════════
export const getUjianBySantri = createServerFn({ method: 'POST' })
  .validator(getSantriUjianSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()

      const tenantId = session.user.tenantId

      // Santri dan wali hanya bisa lihat punya dirinya
      if (session.user.role === 'santri' && session.user.santriId !== data.santriId) {
        throw new ForbiddenError('Akses ditolak')
      }
      // Wali: validasi terhubung ke santri tsb
      if (session.user.role === 'wali') {
        const [link] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.id, session.user.id), eq(users.santriId, data.santriId)))
          .limit(1)
        if (!link) throw new ForbiddenError('Akses ditolak')
      }

      const results = await db.query.ujian.findMany({
        where: and(
          eq(ujian.santriId, data.santriId),
          eq(ujian.tenantId, tenantId)
        ),
        orderBy: [desc(ujian.createdAt)],
        with: {
          ustadz: { columns: { nama: true } },
        }
      })

      const mapped = results.map(u => ({
        ...u,
        ustadzNama: u.ustadz.nama,
      }))

      return success(mapped, 'Riwayat ujian santri berhasil diambil')
    } catch (err) {
      return handleError(err)
    }
  })

// ══════════════════════════════════════════════════════════
// 5. GET RIWAYAT UJIAN SANTRI SENDIRI (Khusus Role Santri)
// ══════════════════════════════════════════════════════════
export const getRiwayatUjianSantri = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      const tenantId = session.user.tenantId
      const santriId = session.user.santriId

      if (!santriId) throw new AuthenticationError('Akses ditolak: Bukan akun santri yang valid.')

      const [santriData] = await db.select({ juzUjianPending: santri.juzUjianPending, tahapSantri: santri.tahapSantri, tipe: santri.tipe }).from(santri).where(eq(santri.id, santriId)).limit(1)

      const results = await db.query.ujian.findMany({
        where: and(
          eq(ujian.tenantId, tenantId),
          eq(ujian.santriId, santriId)
        ),
        orderBy: [desc(ujian.createdAt)],
        limit: 50,
        with: {
          ustadz: { columns: { nama: true } }
        }
      })

      const mappedResults = results.map(u => ({
        ...u,
        ustadzNama: u.ustadz?.nama || 'Tanpa Ustadz'
      }))

      return success({
        riwayat: mappedResults,
        juzUjianPending: santriData?.juzUjianPending || null,
        tahapSantri: santriData?.tahapSantri || 'tahfidz',
        tipe: santriData?.tipe || 'reguler'
      }, 'Riwayat ujian berhasil dimuat')
    } catch (err) {
      return handleError(err)
    }
  })


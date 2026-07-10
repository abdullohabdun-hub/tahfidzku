// src/server-fns/ustadz.ts
// Server Functions untuk modul Ustadz — dijalankan di server, dipanggil dari React

import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, gte } from 'drizzle-orm'
import { db } from '../db'
import { setoran } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { createSetoranSchema, updateSetoranSchema } from '../lib/validators'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ForbiddenError } from '../lib/errors'

import { santri } from '../db/schema/santri'
import { kelas } from '../db/schema/kelas'
import { z } from 'zod'

// ═══════════════════════════════════════════════════════
// 1. INPUT SETORAN BARU
// ═══════════════════════════════════════════════════════
export const createSetoran = createServerFn({ method: 'POST' })
  .validator(createSetoranSchema)
  .handler(async ({ data }) => {
    try {
      // ── Auth: siapa yang memanggil? ──
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      // ── Kunci Multi-Tenant ──
      // tenantId & ustadzId SELALU dari session, TIDAK PERNAH dari client
      const tenantId = session.user.tenantId



      // ── Insert ke database ──
      const [result] = await db
        .insert(setoran)
        .values({
          tenantId,
          santriId: data.santriId,
          ustadzId: session.user.id,
          jenis: data.jenis,
          juz: data.juz ?? null,
          juzMulai: data.juzMulai ?? null,
          juzSelesai: data.juzSelesai ?? null,
          lintasJuz: data.lintasJuz ?? false,
          halamanAwal: data.halamanAwal ?? null,
          halamanAkhir: data.halamanAkhir ?? null,
          surah: data.surah ?? null,
          ayatAwal: data.ayatAwal ?? null,
          ayatAkhir: data.ayatAkhir ?? null,
          surahMeta: data.surahMeta ?? null,
          kualitas: data.kualitas,
          catatan: data.catatan ?? null,
        })
        .returning()

      // ── Update Tracker Ziyadah ──
      if (data.jenis === 'ziyadah' && data.surahNomor && data.ayatAkhir) {
        await db
          .update(santri)
          .set({ posisiTerakhir: { surahNomor: data.surahNomor, ayat: data.ayatAkhir } })
          .where(eq(santri.id, data.santriId))
      }

      return success(result, 'Setoran berhasil disimpan')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 1.1 GET SANTRI LIST
// ═══════════════════════════════════════════════════════
export const getSantriList = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await getAuthSession()
    if (!session) throw new AuthenticationError()
    requireRole(session, 'ustadz')

    const tenantId = session.user.tenantId
    const results = await db.select().from(santri).where(eq(santri.tenantId, tenantId)).orderBy(santri.nama)
    return success(results, 'Data santri berhasil dimuat')
  } catch (err) {
    return handleError(err)
  }
})

// ═══════════════════════════════════════════════════════
// 1.2 GET LAST SETORAN (Rekam Jejak)
// ═══════════════════════════════════════════════════════
export const getLastSetoran = createServerFn({ method: 'GET' })
  .validator(z.object({ santriId: z.string().uuid(), jenis: z.enum(['ziyadah', 'sabqi', 'manzil']) }))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId
      const [result] = await db
        .select()
        .from(setoran)
        .where(and(eq(setoran.tenantId, tenantId), eq(setoran.santriId, data.santriId), eq(setoran.jenis, data.jenis)))
        .orderBy(desc(setoran.createdAt))
        .limit(1)

      return success(result ?? null, 'Data setoran terakhir berhasil dimuat')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 2. EDIT SETORAN
// ═══════════════════════════════════════════════════════
export const updateSetoran = createServerFn({ method: 'POST' })
  .validator(updateSetoranSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId

      // Update HANYA jika setoran milik tenant yang sama DAN milik ustadz ini
      const [result] = await db
        .update(setoran)
        .set({
          santriId: data.santriId,
          jenis: data.jenis,
          surah: data.surah,
          ayatAwal: data.ayatAwal,
          ayatAkhir: data.ayatAkhir,
          kualitas: data.kualitas,
          catatan: data.catatan ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(setoran.id, data.id),
            eq(setoran.tenantId, tenantId),       // ← Kunci tenant
            eq(setoran.ustadzId, session.user.id), // ← Hanya pemilik
          ),
        )
        .returning()

      if (!result) {
        return handleError(new ForbiddenError('Setoran tidak ditemukan atau bukan milik Anda'))
      }

      return success(result, 'Setoran berhasil diperbarui')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 3. RIWAYAT SETORAN (List)
// ═══════════════════════════════════════════════════════
export const getSetoranRiwayat = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId

      // Ambil setoran HANYA dari tenant & ustadz yang login
      const results = await db
        .select()
        .from(setoran)
        .where(
          and(
            eq(setoran.tenantId, tenantId),
            eq(setoran.ustadzId, session.user.id),
          ),
        )
        .orderBy(desc(setoran.createdAt))
        .limit(50)

      return success(results, 'Riwayat setoran berhasil dimuat')
    } catch (err) {
      return handleError(err)
    }
  },
)

// ═══════════════════════════════════════════════════════
// 4. DASHBOARD USTADZ (Statistik ringkas)
// ═══════════════════════════════════════════════════════
export const getUstadzDashboard = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId

      // Hitung total setoran hari ini dari ustadz ini
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // 1. Ambil data santri yang diajar oleh ustadz ini (lewat relasi kelas)
      const santriBinaan = await db
        .select({
          id: santri.id,
          nama: santri.nama,
          targetJuz: santri.targetJuz,
        })
        .from(santri)
        .innerJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(
          and(
            eq(santri.tenantId, tenantId),
            eq(kelas.ustadzId, session.user.id)
          )
        )

      // 2. Ambil data setoran hari ini (beserta nama santrinya)
      const setoranHariIni = await db
        .select({
          id: setoran.id,
          santriId: setoran.santriId,
          santriNama: santri.nama,
          jenis: setoran.jenis,
          surah: setoran.surah,
          ayatAwal: setoran.ayatAwal,
          ayatAkhir: setoran.ayatAkhir,
          kualitas: setoran.kualitas,
          createdAt: setoran.createdAt
        })
        .from(setoran)
        .leftJoin(santri, eq(setoran.santriId, santri.id))
        .where(
          and(
            eq(setoran.tenantId, tenantId),
            eq(setoran.ustadzId, session.user.id),
            gte(setoran.createdAt, today)
          )
        )
        .orderBy(desc(setoran.createdAt))

      // 3. Filter santri yang belum setor hari ini
      const sudahSetorIds = setoranHariIni.map((s) => s.santriId)
      const belumSetor = santriBinaan.filter((s) => !sudahSetorIds.includes(s.id))

      return success(
        {
          namaUstadz: session.user.nama,
          totalSantri: santriBinaan.length,
          totalSetoran: setoranHariIni.length,
          setoranTerbaru: setoranHariIni.slice(0, 5),
          belumSetor: belumSetor.slice(0, 5),
        },
        'Dashboard berhasil dimuat',
      )
    } catch (err) {
      return handleError(err)
    }
  },
)

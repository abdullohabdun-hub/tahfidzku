import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { setoran, santri } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { createSetoranSchema, updateSetoranSchema } from '../lib/validators'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ForbiddenError } from '../lib/errors'
import { z } from 'zod'
import { cariJuzUntukAyat, getAyatTerakhirJuz } from '../lib/quranMapper'

// ═══════════════════════════════════════════════════════
// 1. INPUT SETORAN BARU (USTADZ)
// ═══════════════════════════════════════════════════════
export const createSetoran = createServerFn({ method: 'POST' })
  .validator(createSetoranSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId

      // Drizzle Transaction: Menjamin data setoran dan update posisiTerakhir atomic
      const result = await db.transaction(async (tx) => {
        // 1. Insert setoran
        const [newSetoran] = await tx
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

        // 2. Update tracker posisiTerakhir jika Ziyadah
        if (data.jenis === 'ziyadah' && data.surahNomor && data.ayatAkhir) {
          const currentSantri = await tx.select({ juzProgress: santri.juzProgress }).from(santri).where(eq(santri.id, data.santriId)).limit(1)
          let newJuzProgress = currentSantri[0]?.juzProgress || []

          const juzSekarang = cariJuzUntukAyat(data.surahNomor, data.ayatAkhir)
          const akhirJuz = getAyatTerakhirJuz(juzSekarang)
          
          if (data.surahNomor === akhirJuz.surahNomor && data.ayatAkhir === akhirJuz.ayat) {
             if (!newJuzProgress.includes(juzSekarang)) {
                 newJuzProgress = [...newJuzProgress, juzSekarang]
             }
          }

          await tx
            .update(santri)
            .set({ 
              posisiTerakhir: { surahNomor: data.surahNomor, ayat: data.ayatAkhir },
              juzProgress: newJuzProgress
            })
            .where(eq(santri.id, data.santriId))
        }

        return newSetoran
      })

      return success(result, 'Setoran berhasil disimpan')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 2. EDIT SETORAN (USTADZ)
// ═══════════════════════════════════════════════════════
export const updateSetoran = createServerFn({ method: 'POST' })
  .validator(updateSetoranSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId

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
            eq(setoran.tenantId, tenantId),
            eq(setoran.ustadzId, session.user.id),
          ),
        )
        .returning()

      if (!result) throw new ForbiddenError('Setoran tidak ditemukan atau bukan milik Anda')
      return success(result, 'Setoran berhasil diperbarui')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 3. GET RIWAYAT SETORAN (USTADZ)
// ═══════════════════════════════════════════════════════
export const getSetoranRiwayat = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId

      const results = await db.query.setoran.findMany({
        where: and(
          eq(setoran.tenantId, tenantId),
          eq(setoran.ustadzId, session.user.id)
        ),
        orderBy: [desc(setoran.createdAt)],
        limit: 50,
        with: {
          santri: { columns: { nama: true } }
        }
      })

      // Map untuk frontend compatibility (santriNama flat)
      const mappedResults = results.map(s => ({
        ...s,
        santriNama: s.santri.nama
      }))

      return success(mappedResults, 'Riwayat setoran berhasil dimuat')
    } catch (err) {
      return handleError(err)
    }
  }
)

// ═══════════════════════════════════════════════════════
// 4. GET LAST SETORAN (Untuk Prefill)
// ═══════════════════════════════════════════════════════
export const getLastSetoran = createServerFn({ method: 'GET' })
  .validator(z.object({ santriId: z.string().uuid(), jenis: z.enum(['ziyadah', 'sabqi', 'manzil']) }))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId
      
      const result = await db.query.setoran.findFirst({
        where: and(
          eq(setoran.tenantId, tenantId),
          eq(setoran.santriId, data.santriId),
          eq(setoran.jenis, data.jenis)
        ),
        orderBy: [desc(setoran.createdAt)]
      })

      return success(result ?? null, 'Data setoran terakhir berhasil dimuat')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 5. GET SEMUA RIWAYAT SETORAN (ADMIN REPORTS)
// ═══════════════════════════════════════════════════════
export const getRiwayatSetoranAdmin = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const tenantId = session.user.tenantId

      const results = await db.query.setoran.findMany({
        where: eq(setoran.tenantId, tenantId),
        orderBy: [desc(setoran.createdAt)],
        limit: 100,
        with: {
          santri: { columns: { nama: true } },
          ustadz: { columns: { nama: true } }
        }
      })

      // Flatten untuk frontend
      const mapped = results.map(s => ({
        ...s,
        santriNama: s.santri?.nama || 'Unknown',
        ustadzNama: s.ustadz?.nama || 'Unknown'
      }))

      return success(mapped, 'Berhasil mengambil riwayat setoran global')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 6. INPUT MUROJAAH MANDIRI (OLEH SANTRI)
// ═══════════════════════════════════════════════════════
export const inputMurojaah = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      jenis: z.enum(['sabqi', 'manzil']),
      juz: z.number().min(1).max(30),
      halaman: z.number().min(1).max(604),
      suratNama: z.string(),
      ayat: z.string().optional(),
      kualitas: z.enum(['lancar', 'mengulang', 'terbata']),
      keterangan: z.string().optional(),
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      const santriId = session.user.santriId
      if (!santriId) throw new Error('Data santri tidak valid.')

      // Cari ustadz yang mengajar kelas santri ini (atau biarkan null jika tidak ada)
      // Untuk MVP, ustadzId wajib di skema setoran. Kita akan mencari ustadz yang ada di tenant ini.
      const ustadzList = await db.query.users.findMany({
        where: (users, { eq, and }) => and(eq(users.tenantId, session.user.tenantId), eq(users.role, 'ustadz')),
        limit: 1
      })
      const ustadzId = ustadzList.length > 0 ? ustadzList[0].id : session.user.id // Fallback

      const record = await db.insert(setoran).values({
        tenantId: session.user.tenantId,
        santriId: santriId,
        ustadzId: ustadzId,
        jenis: data.jenis,
        juz: data.juz,
        juzMulai: data.juz,
        halamanAwal: data.halaman, 
        halamanAkhir: data.halaman,
        surah: data.suratNama,
        ayatAwal: 1, 
        ayatAkhir: 286, 
        kualitas: data.kualitas,
        catatan: data.keterangan || null,
      }).returning()

      return success(record[0], 'Murojaah berhasil dilaporkan!')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 7. GET LAPORAN BULANAN (ADMIN REPORTS)
// ═══════════════════════════════════════════════════════
export const getMonthlyReport = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    const schema = z.object({
      year: z.number(),
      month: z.number() // 1-12
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const startDate = new Date(data.year, data.month - 1, 1)
      const endDate = new Date(data.year, data.month, 1)

      const reportData = await db.query.setoran.findMany({
        where: (setoran, { eq, and, gte, lt }) => and(
          eq(setoran.tenantId, session.user.tenantId),
          gte(setoran.createdAt, startDate),
          lt(setoran.createdAt, endDate)
        ),
        orderBy: (setoran, { desc }) => [desc(setoran.createdAt)],
        with: {
          santri: {
            columns: { nama: true },
            with: {
              kelas: { columns: { nama: true } }
            }
          },
          ustadz: { columns: { nama: true } }
        }
      })

      const mapped = reportData.map(s => ({
        ...s,
        santriNama: s.santri?.nama || 'Unknown',
        kelasNama: s.santri?.kelas?.nama || 'Unknown',
        ustadzNama: s.ustadz?.nama || 'Unknown'
      }))

      return success(mapped, 'Berhasil mengambil laporan bulanan')
    } catch (err) {
      return handleError(err)
    }
  })


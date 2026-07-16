import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { setoran, santri } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { createSetoranSchema, updateSetoranSchema } from '../lib/validators'
import { success, handleError } from '../lib/response'
import { kelas } from '../db/schema'
import { AuthenticationError, ForbiddenError, ValidationError } from '../lib/errors'
import { z } from 'zod'
import { cariJuzUntukAyat, getAyatTerakhirJuz, getValidJuzList } from '../lib/quranMapper'


// Helper function to safely calculate the final position for Ziyadah
// This ensures that even for cross-surah entries, we pick the true ending point.
function kalkulasiPosisiTerakhirZiyadah(payloadSurahNomor: number, payloadAyatAkhir: number, surahMeta?: any) {
  let akhirSurahNomor = payloadSurahNomor;
  let akhirAyat = payloadAyatAkhir;

  if (surahMeta && Array.isArray(surahMeta.meta) && surahMeta.meta.length > 0) {
    // Always use the LAST segment in case of multiple segments
    const lastSegmen = surahMeta.meta[surahMeta.meta.length - 1];
    if (lastSegmen && lastSegmen.surahSelesai) {
      akhirSurahNomor = lastSegmen.surahSelesai.nomor ?? akhirSurahNomor;
      akhirAyat = lastSegmen.surahSelesai.ayat ?? akhirAyat;
    }
  }

  return { surahNomor: akhirSurahNomor, ayat: akhirAyat };
}

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

      // Hapus penggunaan db.transaction() karena tidak didukung Neon HTTP
      // 1. Insert setoran
      const [newSetoran] = await db
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
          sumber: 'ustadz',
        })
        .returning()

      // 2. Update tracker posisiTerakhir jika Ziyadah
      if (data.jenis === 'ziyadah' && data.surahNomor && data.ayatAkhir) {
        const currentSantri = await db.select({ juzProgress: santri.juzProgress }).from(santri).where(eq(santri.id, data.santriId)).limit(1)
        let newJuzProgress = currentSantri[0]?.juzProgress || []

        const juzSekarang = cariJuzUntukAyat(data.surahNomor, data.ayatAkhir)
        const akhirJuz = getAyatTerakhirJuz(juzSekarang)
        
        if (data.surahNomor === akhirJuz.surahNomor && data.ayatAkhir === akhirJuz.ayat) {
           if (!newJuzProgress.includes(juzSekarang)) {
               newJuzProgress = [...newJuzProgress, juzSekarang]
           }
        }

        await db
          .update(santri)
          .set({ 
            posisiTerakhir: { surahNomor: data.surahNomor, ayat: data.ayatAkhir },
            juzProgress: newJuzProgress
          })
          .where(eq(santri.id, data.santriId))
      }

      return success(newSetoran, 'Setoran berhasil disimpan')
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
      
      // Ambil data lama
      const [oldSetoran] = await db.select().from(setoran).where(
        and(
          eq(setoran.id, data.id),
          eq(setoran.tenantId, tenantId),
          eq(setoran.ustadzId, session.user.id)
        )
      ).limit(1)

      if (!oldSetoran) throw new ForbiddenError('Setoran tidak ditemukan atau bukan milik Anda')

      // Batas waktu edit 7 hari
      const MAX_EDIT_AGE_MS = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - new Date(oldSetoran.createdAt).getTime() > MAX_EDIT_AGE_MS) {
        throw new ForbiddenError('Data ini sudah berusia lebih dari 7 hari dan tidak bisa diedit lagi untuk menjaga validitas laporan.')
      }
      
      // Jenis tidak boleh diubah
      if (oldSetoran.jenis !== data.jenis) {
        throw new ValidationError('Jenis setoran tidak boleh diubah. Silakan hapus data ini dan buat baru jika jenisnya salah.')
      }

      const previousData = {
        juz: oldSetoran.juz,
        juzMulai: oldSetoran.juzMulai,
        juzSelesai: oldSetoran.juzSelesai,
        halamanAwal: oldSetoran.halamanAwal,
        halamanAkhir: oldSetoran.halamanAkhir,
        surah: oldSetoran.surah,
        surahMeta: oldSetoran.surahMeta,
        ayatAwal: oldSetoran.ayatAwal,
        ayatAkhir: oldSetoran.ayatAkhir,
        kualitas: oldSetoran.kualitas,
        catatan: oldSetoran.catatan
      }

      if (data.jenis === 'ziyadah') {
        if (!data.surahNomor || !data.ayatAkhir) {
          throw new ValidationError('Data surah dan ayat akhir tidak lengkap untuk Ziyadah')
        }
        
        // Cek secara atomik apakah ini ziyadah terbaru
        const execRes = await db.execute(sql`
          UPDATE "setoran"
          SET 
            "surah" = ${data.surah},
            "ayat_awal" = ${data.ayatAwal},
            "ayat_akhir" = ${data.ayatAkhir},
            "surah_meta" = ${data.surahMeta}::jsonb,
            "kualitas" = ${data.kualitas},
            "catatan" = ${data.catatan || null},
            "updated_at" = NOW(),
            "updated_by" = ${session.user.id},
            "previous_data" = ${previousData}::jsonb
          WHERE "id" = ${data.id}
            AND "tenant_id" = ${tenantId}
            AND "ustadz_id" = ${session.user.id}
            AND "id" = (
              SELECT "id" FROM "setoran" 
              WHERE "santri_id" = ${data.santriId} AND "jenis" = 'ziyadah' 
              ORDER BY "created_at" DESC LIMIT 1
            )
          RETURNING *;
        `)

        const result = (execRes as any).rows ? (execRes as any).rows[0] : (execRes as any)[0];

        if (!result) {
          throw new ForbiddenError('Data ini sudah tidak bisa diedit karena sudah ada setoran ziyadah baru sesudahnya.')
        }

        // Hitung ulang posisiTerakhir
        const currentSantri = await db.select({ juzProgress: santri.juzProgress }).from(santri).where(eq(santri.id, data.santriId)).limit(1)
        let newJuzProgress = currentSantri[0]?.juzProgress || []

        const juzSekarang = cariJuzUntukAyat(data.surahNomor, data.ayatAkhir)
        const akhirJuz = getAyatTerakhirJuz(juzSekarang)
        
        if (data.surahNomor === akhirJuz.surahNomor && data.ayatAkhir === akhirJuz.ayat) {
           if (!newJuzProgress.includes(juzSekarang)) {
               newJuzProgress = [...newJuzProgress, juzSekarang]
           }
        }

        await db
          .update(santri)
          .set({ 
            posisiTerakhir: { surahNomor: data.surahNomor, ayat: data.ayatAkhir },
            juzProgress: newJuzProgress
          })
          .where(eq(santri.id, data.santriId))

        return success(result, 'Setoran ziyadah berhasil diperbarui')

      } else {
        // Sabqi atau Manzil
        const [result] = await db
          .update(setoran)
          .set({
            juzMulai: data.juzMulai,
            juzSelesai: data.juzSelesai,
            lintasJuz: data.lintasJuz,
            halamanAwal: data.halamanAwal,
            halamanAkhir: data.halamanAkhir,
            kualitas: data.kualitas,
            catatan: data.catatan || null,
            updatedAt: new Date(),
            updatedBy: session.user.id,
            previousData,
          })
          .where(
            and(
              eq(setoran.id, data.id),
              eq(setoran.tenantId, tenantId),
              eq(setoran.ustadzId, session.user.id),
            ),
          )
          .returning()

        return success(result, 'Setoran berhasil diperbarui')
      }
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 3. GET RIWAYAT SETORAN (USTADZ)
// ═══════════════════════════════════════════════════════
export const getSetoranRiwayat = createServerFn({ method: 'POST' }).handler(
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
export const getLastSetoran = createServerFn({ method: 'POST' })
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
export const getRiwayatSetoranAdmin = createServerFn({ method: 'POST' })
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
      lintasJuz: z.boolean().default(false),
      juzMulai: z.number().nullable().optional(),
      juzSelesai: z.number().nullable().optional(),
      halamanAwal: z.number(),
      halamanAkhir: z.number(),
      surahMeta: z.record(z.string(), z.any()),
      kualitas: z.enum(['lancar', 'mengulang', 'terbata']),
      catatan: z.string().optional(),
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
      const santriKelas = await db.select({ ustadzId: kelas.ustadzId })
        .from(santri)
        .leftJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(eq(santri.id, santriId))
        .limit(1)

      let assignedUstadzId = santriKelas[0]?.ustadzId
      
      if (!assignedUstadzId) {
          // fallback ke admin atau ustadz pertama
          const ustadzList = await db.query.users.findMany({
            where: (users, { eq, and }) => and(eq(users.tenantId, session.user.tenantId), eq(users.role, 'ustadz')),
            limit: 1
          })
          assignedUstadzId = ustadzList.length > 0 ? ustadzList[0].id : session.user.id // Fallback
      }

      // Validasi Sabqi/Manzil Juz di backend
      if (data.jenis === 'sabqi' || data.jenis === 'manzil') {
        const profile = await db.query.santri.findFirst({ where: eq(santri.id, santriId) })
        if (profile) {
           const validJuzList = getValidJuzList(profile)
           if (!data.lintasJuz && data.juzMulai && !validJuzList.includes(data.juzMulai)) {
              throw new ValidationError(`Juz ${data.juzMulai} belum ada di riwayat hafalanmu.`)
           }
           if (data.lintasJuz && data.juzMulai && data.juzSelesai && (!validJuzList.includes(data.juzMulai) || !validJuzList.includes(data.juzSelesai))) {
              throw new ValidationError('Rentang lintas juz memuat juz yang belum dihafal.')
           }
        }
      }

      const record = await db.insert(setoran).values({
        tenantId: session.user.tenantId,
        santriId: santriId,
        ustadzId: assignedUstadzId,
        jenis: data.jenis,
        juz: !data.lintasJuz ? data.juzMulai : null,
        juzMulai: data.juzMulai || null,
        juzSelesai: data.juzSelesai || null,
        lintasJuz: data.lintasJuz,
        halamanAwal: data.halamanAwal, 
        halamanAkhir: data.halamanAkhir,
        surah: null, // Legacy field, surahMeta handles this now, or we can extract from surahMeta
        surahMeta: data.surahMeta,
        kualitas: data.kualitas,
        catatan: data.catatan || null,
        sumber: 'santri_self_report',
      }).returning()

      return success(record[0], 'Murojaah berhasil dilaporkan!')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 7. GET LAPORAN BULANAN (ADMIN REPORTS)
// ═══════════════════════════════════════════════════════
export const getMonthlyReport = createServerFn({ method: 'POST' })
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

// ═══════════════════════════════════════════════════════
// 8. GET RIWAYAT SETORAN (SANTRI)
// ═══════════════════════════════════════════════════════
export const getRiwayatSetoranSantri = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      const tenantId = session.user.tenantId
      const santriId = session.user.santriId

      if (!santriId) throw new AuthenticationError('Akses ditolak: Bukan akun santri yang valid.')

      // Drizzle's relational queries (.findMany with 'with') inherently use LEFT JOIN
      // behaviour, meaning rows where ustadzId is null will STILL be returned!
      const results = await db.query.setoran.findMany({
        where: and(
          eq(setoran.tenantId, tenantId),
          eq(setoran.santriId, santriId)
        ),
        orderBy: [desc(setoran.createdAt)],
        limit: 50,
        with: {
          ustadz: { columns: { nama: true } }
        }
      })

      // Map untuk frontend compatibility
      const mappedResults = results.map(s => ({
        ...s,
        ustadzNama: s.ustadz?.nama || 'Tanpa Ustadz'
      }))

      return success(mappedResults, 'Riwayat hafalan berhasil dimuat')
    } catch (err) {
      return handleError(err)
    }
  }
)
// ═══════════════════════════════════════════════════════
// 9. EDIT MUROJAAH MANDIRI (OLEH SANTRI)
// ═══════════════════════════════════════════════════════
export const updateSetoranSantri = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      id: z.string().uuid(),
      jenis: z.enum(['sabqi', 'manzil']),
      lintasJuz: z.boolean().default(false),
      juzMulai: z.number().nullable().optional(),
      juzSelesai: z.number().nullable().optional(),
      halamanAwal: z.number(),
      halamanAkhir: z.number(),
      surahMeta: z.record(z.string(), z.any()),
      kualitas: z.enum(['lancar', 'mengulang', 'terbata']),
      catatan: z.string().optional(),
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
      const tenantId = session.user.tenantId

      const [oldSetoran] = await db.select().from(setoran).where(
        and(
          eq(setoran.id, data.id),
          eq(setoran.tenantId, tenantId),
          eq(setoran.santriId, santriId),
          eq(setoran.sumber, 'santri_self_report')
        )
      ).limit(1)

      if (!oldSetoran) throw new ForbiddenError('Setoran tidak ditemukan atau bukan milik Anda')

      // Batas waktu edit 7 hari
      const MAX_EDIT_AGE_MS = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - new Date(oldSetoran.createdAt).getTime() > MAX_EDIT_AGE_MS) {
        throw new ForbiddenError('Data ini sudah berusia lebih dari 7 hari dan tidak bisa diedit lagi untuk menjaga validitas laporan.')
      }
      
      // Jenis tidak boleh diubah
      if (oldSetoran.jenis !== data.jenis) {
        throw new ValidationError('Jenis setoran tidak boleh diubah.')
      }

      // Validasi Juz yang sudah dihafal menggunakan getValidJuzList
      const profile = await db.query.santri.findFirst({ where: eq(santri.id, santriId) })
      if (profile) {
         const validJuzList = getValidJuzList(profile)
         if (!data.lintasJuz && data.juzMulai && !validJuzList.includes(data.juzMulai)) {
            throw new ValidationError(`Juz ${data.juzMulai} belum ada di riwayat hafalanmu.`)
         }
         if (data.lintasJuz && data.juzMulai && data.juzSelesai && (!validJuzList.includes(data.juzMulai) || !validJuzList.includes(data.juzSelesai))) {
            throw new ValidationError('Rentang lintas juz memuat juz yang belum dihafal.')
         }
      }

      const previousData = {
        juz: oldSetoran.juz,
        juzMulai: oldSetoran.juzMulai,
        juzSelesai: oldSetoran.juzSelesai,
        halamanAwal: oldSetoran.halamanAwal,
        halamanAkhir: oldSetoran.halamanAkhir,
        surahMeta: oldSetoran.surahMeta,
        kualitas: oldSetoran.kualitas,
        catatan: oldSetoran.catatan
      }

      const [result] = await db
        .update(setoran)
        .set({
          juzMulai: data.juzMulai,
          juzSelesai: data.juzSelesai,
          lintasJuz: data.lintasJuz,
          halamanAwal: data.halamanAwal,
          halamanAkhir: data.halamanAkhir,
          surahMeta: data.surahMeta,
          kualitas: data.kualitas,
          catatan: data.catatan || null,
          updatedAt: new Date(),
          updatedBy: session.user.id,
          previousData,
        })
        .where(
          and(
            eq(setoran.id, data.id),
            eq(setoran.tenantId, tenantId),
            eq(setoran.santriId, santriId),
            eq(setoran.sumber, 'santri_self_report')
          )
        )
        .returning()

      return success(result, 'Laporan Murojaah berhasil diperbarui')
    } catch (err) {
      return handleError(err)
    }
  })
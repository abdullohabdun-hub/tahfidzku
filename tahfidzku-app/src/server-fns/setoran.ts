import { createServerFn } from '@tanstack/react-start'
import { getTodayWIB } from '../lib/dateUtils'
import { precomputeRekapMingguan } from './cron'
import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { setoran, santri, rubrikPenilaian } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { createSetoranSchema, updateSetoranSchema } from '../lib/validators'
import { success, handleError } from '../lib/response'
import { kelas } from '../db/schema'
import { AuthenticationError, ForbiddenError, ValidationError, NotFoundError } from '../lib/errors'
import { z } from 'zod'
import { cariJuzUntukAyat, getAyatTerakhirJuz, getValidJuzList } from '../lib/quranMapper'


// Helper for dynamic validation
// Legacy validatePenilaianKustom removed since we use standard scoring 1-5

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

      const todayWIB = getTodayWIB()
      const isBackdated = data.tanggalSetoran < todayWIB

      const [curSantri] = await db
        .select({ juzUjianPending: santri.juzUjianPending, createdAt: santri.createdAt })
        .from(santri)
        .where(and(eq(santri.id, data.santriId), eq(santri.tenantId, tenantId)))
        .limit(1)

      if (!curSantri) throw new ValidationError('Santri tidak ditemukan')

      // Validasi batas enrollment
      const enrollDate = new Date(curSantri.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      if (data.tanggalSetoran < enrollDate) {
        throw new ValidationError('Tanggal setoran tidak boleh mendahului tanggal santri didaftarkan.')
      }

      // GATING: Blokir Ziyadah baru jika santri masih punya ujian kenaikan pending
      if (data.jenis === 'ziyadah' && curSantri.juzUjianPending) {
        throw new ValidationError(
          `Santri ini masih memiliki Ujian Kenaikan Juz ${curSantri.juzUjianPending} yang belum diselesaikan. ` +
          `Selesaikan ujian terlebih dahulu sebelum melanjutkan Ziyadah.`
        )
      }

      // ─── TRANSAKSI: data inti wajib atomik ───────────────
      const newSetoran = await db.transaction(async (tx) => {
        // ① INSERT setoran
        const [row] = await tx
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
            kualitas: data.kualitas ?? null, // DEPRECATED
            skorKualitas: (data as any).skorKualitas ?? null,
            skorKualitasBacaan: (data as any).skorKualitasBacaan ?? null,
            statusHafalan: (data as any).statusHafalan ?? null,
            penilaianKustom: data.penilaianKustom ?? null,
            catatan: data.catatan ?? null,
            sumber: 'ustadz',
            tanggalSetoran: data.tanggalSetoran,
            isBackdated,
          })
          .returning()

        // ② Guard posisiTerakhir + juzUjianPending (satu CTE, atomik)
        if (data.jenis === 'ziyadah' && data.surahNomor && data.ayatAkhir) {
          const surahSelesaiNo = data.surahMeta?.meta?.[0]?.surahSelesai?.nomor;
          if (!surahSelesaiNo) {
            throw new ValidationError('Data surahSelesai tidak ditemukan dalam meta Ziyadah');
          }
          const newPosisi = { surahNomor: surahSelesaiNo, ayat: data.ayatAkhir }
          
          let juzSelesaiToSet: number | null = null
          const juzSelesaiNow = cariJuzUntukAyat(surahSelesaiNo, data.ayatAkhir)
          if (juzSelesaiNow) {
            const akhirJuz = getAyatTerakhirJuz(juzSelesaiNow)
            if (surahSelesaiNo === akhirJuz.surahNomor && data.ayatAkhir === akhirJuz.ayat) {
              juzSelesaiToSet = juzSelesaiNow
            }
          }

          // Gunakan CTE agar NOT EXISTS hanya dievaluasi sekali
          // Update JSONB di Drizzle sql menggunakan literal binding
          await tx.execute(sql`
            WITH is_latest AS (
              SELECT NOT EXISTS (
                SELECT 1 FROM setoran
                WHERE santri_id = ${data.santriId}
                  AND jenis = 'ziyadah'
                  AND tanggal_setoran > ${data.tanggalSetoran}
              ) AS boleh_update
            )
            UPDATE santri SET
              posisi_terakhir   = CASE WHEN (SELECT boleh_update FROM is_latest)
                                    THEN ${JSON.stringify(newPosisi)}::jsonb ELSE posisi_terakhir END,
              juz_ujian_pending = CASE WHEN (SELECT boleh_update FROM is_latest)
                                         AND ${juzSelesaiToSet ?? null}::integer IS NOT NULL
                                    THEN ${juzSelesaiToSet}::integer ELSE juz_ujian_pending END

            WHERE id = ${data.santriId}
          `)
        }

        return row
      })
      // ─── END TRANSAKSI ───

      // ③ Re-trigger precompute SETELAH commit, di luar transaksi
      if (isBackdated) {
        try {
          await precomputeRekapMingguan({
            data: { tanggalAcuan: data.tanggalSetoran, tenantId }
          })
        } catch (recomputeErr) {
          console.error('[backfill-recompute] Gagal recompute rekap mingguan:', recomputeErr)
        }
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
      
      // Validasi Wajib-Isi Dinamis


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
      if (Date.now() - new Date(oldSetoran.tanggalSetoran).getTime() > MAX_EDIT_AGE_MS) {
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
            "surah_meta" = ${data.surahMeta ? JSON.stringify(data.surahMeta) : null}::jsonb,
            "kualitas" = ${data.kualitas ?? null},
            "skor_kualitas" = ${(data as any).skorKualitas ?? null},
            "skor_kualitas_bacaan" = ${(data as any).skorKualitasBacaan ?? null},
            "status_hafalan" = ${(data as any).statusHafalan ?? null},
            "penilaian_kustom" = ${data.penilaianKustom ? JSON.stringify(data.penilaianKustom) : null}::jsonb,
            "catatan" = ${data.catatan || null},
            "updated_at" = NOW(),
            "updated_by" = ${session.user.id},
            "previous_data" = ${JSON.stringify(previousData)}::jsonb

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

        // Cek apakah posisi tepat di ayat terakhir sebuah juz → trigger ujian pending, else clear
        const surahSelesaiNo = data.surahMeta?.meta?.[0]?.surahSelesai?.nomor;
        if (!surahSelesaiNo) {
          throw new ValidationError('Data surahSelesai tidak ditemukan dalam meta Ziyadah saat update');
        }
        const juzSelesaiNow = cariJuzUntukAyat(surahSelesaiNo, data.ayatAkhir)
        let setJuzPending: number | null = null;
        if (juzSelesaiNow) {
          const akhirJuz = getAyatTerakhirJuz(juzSelesaiNow)
          if (surahSelesaiNo === akhirJuz.surahNomor && data.ayatAkhir === akhirJuz.ayat) {
            setJuzPending = juzSelesaiNow;
          }
        }

        // Hitung ulang posisiTerakhir dan update juzUjianPending
        await db
          .update(santri)
          .set({ 
            posisiTerakhir: { surahNomor: surahSelesaiNo, ayat: data.ayatAkhir },
            juzUjianPending: setJuzPending
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
            kualitas: data.kualitas ?? null,
            skorKualitas: (data as any).skorKualitas ?? null,
            skorKualitasBacaan: (data as any).skorKualitasBacaan ?? null,
            statusHafalan: (data as any).statusHafalan ?? null,
            penilaianKustom: data.penilaianKustom ?? null,
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
        orderBy: [desc(setoran.tanggalSetoran), desc(setoran.createdAt)],
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
      console.error('❌ [CRITICAL_RIWAYAT_ERROR]', {
        name: (err as Error)?.name,
        message: (err as Error)?.message,
        stack: (err as Error)?.stack,
        cause: (err as any)?.cause,
      })
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
        orderBy: [desc(setoran.tanggalSetoran), desc(setoran.createdAt)]
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
        orderBy: [desc(setoran.tanggalSetoran), desc(setoran.createdAt)],
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
      kualitas: z.enum(['lancar', 'mengulang', 'terbata']).optional().nullable(),
      penilaianKustom: z.record(z.string(), z.any()).optional().nullable(),
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
      const santriKelas = await db.select({ ustadzId: kelas.ustadzId, kelasId: kelas.id })
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

      // Validasi Wajib-Isi Dinamis


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

      const todayWIB = getTodayWIB()

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
        penilaianKustom: data.penilaianKustom,
        catatan: data.catatan || null,
        sumber: 'santri_self_report',
        ditinjauOlehUstadz: false,
        tanggalSetoran: todayWIB,
        isBackdated: false,
      }).returning()

      const newSetoran = record[0]
      const actualKelasUstadzId = santriKelas[0]?.ustadzId

      if (actualKelasUstadzId) {
        try {
          const { notifikasiUstadz } = await import('../db/schema/notifikasi')
          await db.insert(notifikasiUstadz).values({
            tenantId: session.user.tenantId,
            ustadzId: actualKelasUstadzId,
            setoranId: newSetoran.id,
            tipe: 'setoran_mandiri_baru',
            pesan: `Santri telah melakukan setoran mandiri (${data.jenis.toUpperCase()}). Menunggu tinjauan Anda.`,
          })
        } catch (e) {
          console.error(`Gagal membuat notifikasi untuk ustadz (santriId: ${santriId}, setoranId: ${newSetoran.id})`, e)
          try {
            const { notifikasiGagalLog } = await import('../db/schema/notifikasi')
            await db.insert(notifikasiGagalLog).values({
              tenantId: session.user.tenantId,
              konteks: 'insert_notifikasi_ustadz',
              referensiId: newSetoran.id,
              errorMessage: e instanceof Error ? e.message : String(e),
            })
          } catch (logError) {
            console.error('Gagal mencatat log kegagalan notifikasi juga:', logError)
          }
        }
      } else {
        console.warn(`[NOTIFIKASI_SKIPPED] Kelas santri tidak memiliki ustadz pengampu. santriId: ${santriId}, kelasId: ${santriKelas[0]?.kelasId || 'unknown'}, setoranId: ${newSetoran.id}`)
      }

      return success(newSetoran, 'Murojaah berhasil dilaporkan!')
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

      const startDateStr = new Date(data.year, data.month - 1, 1).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      const endDateStr = new Date(data.year, data.month, 1).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

      const reportData = await db.query.setoran.findMany({
        where: (setoran, { eq, and, gte, lt }) => and(
          eq(setoran.tenantId, session.user.tenantId),
          gte(setoran.tanggalSetoran, startDateStr),
          lt(setoran.tanggalSetoran, endDateStr)
        ),
        orderBy: (setoran, { desc }) => [desc(setoran.tanggalSetoran), desc(setoran.createdAt)],
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
        orderBy: [desc(setoran.tanggalSetoran), desc(setoran.createdAt)],
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
      kualitas: z.enum(['lancar', 'mengulang', 'terbata']).optional().nullable(),
      penilaianKustom: z.record(z.string(), z.any()).optional().nullable(),
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

      // Validasi Wajib-Isi Dinamis


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

// ═══════════════════════════════════════════════════════
// 11. GET SETORAN DETAIL (USTADZ)
// ═══════════════════════════════════════════════════════
export const getSetoranDetailUstadz = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      setoranId: z.string().uuid()
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const detail = await db.query.setoran.findFirst({
        where: eq(setoran.id, data.setoranId),
        with: {
          santri: {
            columns: { nama: true },
            with: { kelas: { columns: { nama: true } } }
          }
        }
      })

      if (!detail) throw new NotFoundError('Setoran tidak ditemukan')
      if (detail.tenantId !== session.user.tenantId) throw new ForbiddenError('Akses ditolak')

      return success(detail, 'Data setoran ditemukan')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 10. SUBMIT FEEDBACK SETORAN MANDIRI (OLEH USTADZ)
// ═══════════════════════════════════════════════════════
export const submitFeedbackSetoran = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      setoranId: z.string().uuid(),
      catatan: z.string().optional(),
      isTemplate: z.boolean().optional().default(false)
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      // Verifikasi IDOR: ustadz hanya boleh memberi feedback pada setoran 
      // yang dibuat oleh santri di kelasnya (kelasUstadzId) ATAU ustadz pengampu setoran (setoranUstadzId)
      const targetSetoran = await db.select({ 
          id: setoran.id, 
          tenantId: setoran.tenantId,
          santriId: setoran.santriId,
          kelasUstadzId: kelas.ustadzId,
          setoranUstadzId: setoran.ustadzId 
        })
        .from(setoran)
        .leftJoin(santri, eq(setoran.santriId, santri.id))
        .leftJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(eq(setoran.id, data.setoranId))
        .limit(1)

      if (targetSetoran.length === 0) {
        throw new NotFoundError('Setoran tidak ditemukan')
      }

      const s = targetSetoran[0]

      if (s.tenantId !== session.user.tenantId || (s.kelasUstadzId !== session.user.id && s.setoranUstadzId !== session.user.id)) {
        throw new ForbiddenError('Anda tidak diizinkan merespons setoran ini.')
      }

      const { notifikasiUstadz, notifikasiSantri } = await import('../db/schema/notifikasi')

      await db.transaction(async (tx) => {
        let finalTipe = 'ditinjau'
        if (data.catatan && data.catatan.trim() !== '') {
          finalTipe = data.isTemplate ? 'template' : 'komentar'
        }

        await tx.update(setoran).set({
          ditinjauOlehUstadz: true,
          responUstadz: {
            tipe: finalTipe,
            catatan: data.catatan,
            diresponOlehUstadzId: session.user.id,
            diresponPada: new Date().toISOString()
          }
        }).where(eq(setoran.id, data.setoranId))

        // Buat notifikasi untuk santri
        if (s.santriId) {
          await tx.insert(notifikasiSantri).values({
            tenantId: session.user.tenantId,
            santriId: s.santriId,
            setoranId: data.setoranId,
            tipe: 'feedback_setoran',
            pesan: 'Ustadz telah memberikan tanggapan pada setoran mandiri Anda.',
          })
        }

        // Tandai notifikasi terkait dibaca
        await tx.update(notifikasiUstadz)
          .set({ dibacaPada: new Date() })
          .where(
            and(
               eq(notifikasiUstadz.setoranId, data.setoranId),
               eq(notifikasiUstadz.ustadzId, session.user.id)
            )
          )
      })

      return success(null, 'Feedback berhasil dikirim')
    } catch (err) {
      return handleError(err)
    }
  })

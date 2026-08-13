import { createServerFn } from '@tanstack/react-start'
import { eq, and, sql, gte, lt } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { santri, kelas, setoran, waliSantri } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError, ForbiddenError } from '../lib/errors'

export const getIndeksPerkembangan = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      santriId: z.string().uuid('santriId tidak valid'),
      periode: z.enum(['bulanan', 'semester_ganjil', 'semester_genap', 'tahunan']).optional().default('bulanan'),
      tahunAjaran: z.number().int().min(2020).max(2100).optional(),
      bulan: z.number().int().min(1).max(12).optional(),
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin', 'ustadz', 'santri', 'wali')

      if (session.user.role === 'santri' && session.user.santriId !== data.santriId) {
        throw new ForbiddenError('Anda hanya dapat melihat indeks perkembangan diri Anda sendiri')
      }

      if (session.user.role === 'wali') {
        let isAnakKandung = session.user.santriId === data.santriId
        if (!isAnakKandung) {
          const anakLink = await db.select({ santriId: waliSantri.santriId })
            .from(waliSantri)
            .where(
              and(
                eq(waliSantri.waliUserId, session.user.id),
                eq(waliSantri.santriId, data.santriId),
                eq(waliSantri.tenantId, session.user.tenantId)
              )
            )
            .limit(1)
          isAnakKandung = anakLink.length > 0
        }
        if (!isAnakKandung) {
          throw new ForbiddenError('Anda hanya dapat mengakses indeks anak Anda sendiri')
        }
      }

      const tenantId = session.user.tenantId
      const { santriId, periode } = data

      // 1. Ambil data santri dan kelas (tipeKelas, target)
      const [santriData] = await db
        .select({
          tipeKelas: kelas.tipeKelas,
          targetHariSetoranBulanan: kelas.targetHariSetoranBulanan,
          targetSelfReportBulanan: kelas.targetSelfReportBulanan,
        })
        .from(santri)
        .leftJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(and(eq(santri.id, santriId), eq(santri.tenantId, tenantId)))
        .limit(1)

      if (!santriData) {
        throw new ValidationError('Santri tidak ditemukan')
      }

      const isMukim = santriData.tipeKelas === 'reguler'
      const targetHariSetoranBulanan = santriData.targetHariSetoranBulanan
      // null = admin belum set → OQ#5b: komponen 5 dikecualikan, bobot 15% diredistribusi ke K1–K4
      const targetSelfReportBulanan = santriData.targetSelfReportBulanan
      const hasTargetSelfReport = !isMukim && targetSelfReportBulanan !== null && targetSelfReportBulanan > 0

      // 2. Hitung rentang waktu
      let awalBulan: Date, akhirBulan: Date
      const year = data.tahunAjaran || new Date().getFullYear()

      if (periode === 'bulanan') {
        const m = data.bulan || new Date().getMonth() + 1
        awalBulan = new Date(year, m - 1, 1)
        akhirBulan = new Date(year, m, 1)
      } else if (periode === 'semester_ganjil') {
        awalBulan = new Date(year, 6, 1)
        akhirBulan = new Date(year + 1, 0, 1)
      } else if (periode === 'semester_genap') {
        awalBulan = new Date(year + 1, 0, 1)
        akhirBulan = new Date(year + 1, 6, 1)
      } else {
        awalBulan = new Date(year, 6, 1)
        akhirBulan = new Date(year + 1, 6, 1)
      }

      const baselineAwalBulan = new Date(awalBulan)
      baselineAwalBulan.setMonth(baselineAwalBulan.getMonth() - 3)

      const awalBulanStr = awalBulan.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      const akhirBulanStr = akhirBulan.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      const baselineAwalBulanStr = baselineAwalBulan.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

      // Hitung durasi periode aktif dalam bulan (untuk normalisasi hari setoran & baseline)
      const diffMonths = (akhirBulan.getFullYear() - awalBulan.getFullYear()) * 12 + (akhirBulan.getMonth() - awalBulan.getMonth())
      const targetHariSetoranPeriode = targetHariSetoranBulanan ? targetHariSetoranBulanan * diffMonths : null

      // 3. Query agregasi

      // Komponen 1 & 2
      const [kualitasKonsistensi] = await db
        .select({
          avgSkorKualitas: sql<number>`AVG(COALESCE(${setoran.skorKualitasBacaan}, ${setoran.skorKualitas}))`,
          hariUnikSetoran: sql<number>`COUNT(DISTINCT ${setoran.tanggalSetoran})::int`,
        })
        .from(setoran)
        .where(
          and(
            eq(setoran.santriId, santriId),
            eq(setoran.tenantId, tenantId),
            gte(setoran.tanggalSetoran, awalBulanStr),
            lt(setoran.tanggalSetoran, akhirBulanStr),
            eq(setoran.sumber, 'ustadz')
          )
        )

      // Helper query baseline & aktif (Ziyadah/Murojaah)
      const getVolume = async (jenisFilter: any, isBaseline: boolean) => {
        const startStr = isBaseline ? baselineAwalBulanStr : awalBulanStr
        const endStr = isBaseline ? awalBulanStr : akhirBulanStr
        const [res] = await db
          .select({
            volume: sql<number>`SUM(${setoran.halamanAkhir} - ${setoran.halamanAwal})::int`,
            countData: sql<number>`COUNT(*)::int`,
          })
          .from(setoran)
          .where(
            and(
              eq(setoran.santriId, santriId),
              eq(setoran.tenantId, tenantId),
              jenisFilter,
              eq(setoran.sumber, 'ustadz'),
              gte(setoran.tanggalSetoran, startStr),
              lt(setoran.tanggalSetoran, endStr)
            )
          )
        return res
      }

      // Komponen 3: Ziyadah
      const volZiyadahAktif = await getVolume(eq(setoran.jenis, 'ziyadah'), false)
      const volZiyadahBaseline = await getVolume(eq(setoran.jenis, 'ziyadah'), true)
      
      // Komponen 4: Murojaah
      const volMurojaahAktif = await getVolume(sql`${setoran.jenis} IN ('sabqi', 'manzil')`, false)
      const volMurojaahBaseline = await getVolume(sql`${setoran.jenis} IN ('sabqi', 'manzil')`, true)

      // Komponen 5: Kemandirian (Self-Report) - non mukim only
      let validSelfReportCount = 0
      if (!isMukim) {
        const [selfReportRes] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(setoran)
          .where(
            and(
              eq(setoran.santriId, santriId),
              eq(setoran.tenantId, tenantId),
              gte(setoran.tanggalSetoran, awalBulanStr),
              lt(setoran.tanggalSetoran, akhirBulanStr),
              eq(setoran.sumber, 'santri_self_report'),
              eq(setoran.ditinjauOlehUstadz, true),
              sql`${setoran.responUstadz}->>'tipe' != 'perlu_perbaikan'`
            )
          )
        validSelfReportCount = selfReportRes.count || 0
      }

      // 4. Perhitungan Skor
      let skorAkhir = 0
      const flags = { coldStart3: false, coldStart4: false, noTargetHariSetoran: false, noTargetSelfReport: false }

      // OQ#5b: kalau targetSelfReportBulanan null (admin belum set), redistribusi 15% proporsional ke K1–K4
      // Bobot asal tanpa K5 (non-mukim): K1=35, K2=25, K3=15, K4=10 → total 85
      // Redistribusi: tiap bobot += (bobotAsli / 85) * 15
      let bobotKualitas: number, bobotKonsistensi: number, bobotZiyadah: number, bobotMurojaah: number
      if (isMukim) {
        bobotKualitas = 0.4
        bobotKonsistensi = 0.3
        bobotZiyadah = 0.2
        bobotMurojaah = 0.1
      } else if (hasTargetSelfReport) {
        // K5 aktif — bobot standar non-mukim
        bobotKualitas = 0.35
        bobotKonsistensi = 0.25
        bobotZiyadah = 0.15
        bobotMurojaah = 0.10
      } else {
        // K5 dikecualikan — redistribusi 15% proporsional ke K1–K4 (total asal 85%)
        flags.noTargetSelfReport = true
        bobotKualitas = 0.35 + (0.35 / 0.85) * 0.15   // ≈ 0.4118
        bobotKonsistensi = 0.25 + (0.25 / 0.85) * 0.15 // ≈ 0.2941
        bobotZiyadah = 0.15 + (0.15 / 0.85) * 0.15     // ≈ 0.1765
        bobotMurojaah = 0.10 + (0.10 / 0.85) * 0.15    // ≈ 0.1176
      }

      const breakdown = {
        kualitas: { skor: 0, bobot: bobotKualitas },
        konsistensi: { skor: 0, bobot: bobotKonsistensi },
        ziyadah: { skor: 0, bobot: bobotZiyadah, coldStart: false },
        murojaah: { skor: 0, bobot: bobotMurojaah, coldStart: false },
        kemandirian: hasTargetSelfReport ? { skor: 0, bobot: 0.15 } : null,
      }

      // Kualitas (0-100)
      const avgKualitas = kualitasKonsistensi?.avgSkorKualitas ? Number(kualitasKonsistensi.avgSkorKualitas) : 0
      breakdown.kualitas.skor = (avgKualitas / 5) * 100

      // Konsistensi (0-100)
      if (!targetHariSetoranPeriode || targetHariSetoranPeriode <= 0) {
        flags.noTargetHariSetoran = true
      } else {
        const hariUnik = kualitasKonsistensi?.hariUnikSetoran || 0
        breakdown.konsistensi.skor = Math.min(100, (hariUnik / targetHariSetoranPeriode) * 100)
      }

      // Progres Ziyadah (0-100)
      const isColdStartZiyadah = volZiyadahBaseline.countData === 0
      const volZB = volZiyadahBaseline.volume ? Number(volZiyadahBaseline.volume) : 0
      const volZA = volZiyadahAktif.volume ? Number(volZiyadahAktif.volume) : 0
      const avgBaselineZiyadah = volZB / 3
      const targetZiyadah = avgBaselineZiyadah * diffMonths

      if (isColdStartZiyadah || targetZiyadah === 0) {
        breakdown.ziyadah.skor = 50
        breakdown.ziyadah.coldStart = true
        flags.coldStart3 = true
      } else {
        breakdown.ziyadah.skor = Math.min(100, (volZA / targetZiyadah) * 100)
      }

      // Kepatuhan Murojaah (0-100)
      const isColdStartMurojaah = volMurojaahBaseline.countData === 0
      const volMB = volMurojaahBaseline.volume ? Number(volMurojaahBaseline.volume) : 0
      const volMA = volMurojaahAktif.volume ? Number(volMurojaahAktif.volume) : 0
      const avgBaselineMurojaah = volMB / 3
      const targetMurojaah = avgBaselineMurojaah * diffMonths

      if (isColdStartMurojaah || targetMurojaah === 0) {
        breakdown.murojaah.skor = 50
        breakdown.murojaah.coldStart = true
        flags.coldStart4 = true
      } else {
        breakdown.murojaah.skor = Math.min(100, (volMA / targetMurojaah) * 100)
      }

      // Kemandirian
      if (hasTargetSelfReport && breakdown.kemandirian && targetSelfReportBulanan) {
        const targetSelfReportPeriode = targetSelfReportBulanan * diffMonths
        breakdown.kemandirian.skor = Math.min(100, (validSelfReportCount / targetSelfReportPeriode) * 100)
      }

      // Akumulasi — K5 hanya masuk kalau hasTargetSelfReport
      skorAkhir += breakdown.kualitas.skor * breakdown.kualitas.bobot
      skorAkhir += breakdown.konsistensi.skor * breakdown.konsistensi.bobot
      skorAkhir += breakdown.ziyadah.skor * breakdown.ziyadah.bobot
      skorAkhir += breakdown.murojaah.skor * breakdown.murojaah.bobot
      if (hasTargetSelfReport && breakdown.kemandirian) {
        skorAkhir += breakdown.kemandirian.skor * breakdown.kemandirian.bobot
      }

      return success({
        skor: Math.round(skorAkhir),
        isMukim,
        breakdown,
        flags,
      }, 'Berhasil menghitung Indeks Perkembangan')
    } catch (err) {
      return handleError(err)
    }
  })

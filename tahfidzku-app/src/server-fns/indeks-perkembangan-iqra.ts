import { createServerFn } from '@tanstack/react-start'
import { eq, and, sql, gte, lt } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { santri, kelas, setoranIqra } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'

export const getIndeksPerkembanganIqra = createServerFn({ method: 'POST' })
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
      // ── Security Guard (wajib) ──
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin', 'ustadz')

      const tenantId = session.user.tenantId
      const { santriId, periode } = data

      // ── IDOR Guard ──
      const [santriData] = await db
        .select({ id: santri.id, targetHari: kelas.targetHariSetoranBulanan })
        .from(santri)
        .leftJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(and(
          eq(santri.id, santriId),
          eq(santri.tenantId, tenantId),
        ))
        .limit(1)

      if (!santriData) throw new ValidationError('Santri tidak ditemukan atau akses ditolak.')

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

      const diffMonths = (akhirBulan.getFullYear() - awalBulan.getFullYear()) * 12 + (akhirBulan.getMonth() - awalBulan.getMonth())
      const targetHariSetoranPeriode = santriData.targetHari ? santriData.targetHari * diffMonths : null

      // 3. Query agregasi
      
      // K1 (Kualitas) & K2 (Konsistensi) & K4 (Kelancaran)
      const [kualitasKonsistensi] = await db
        .select({
          avgSkorKualitas: sql<number>`AVG(${setoranIqra.skorKualitas})`,
          hariUnikSetoran: sql<number>`COUNT(DISTINCT ${setoranIqra.tanggalSetoran})::int`,
          totalSetoran: sql<number>`COUNT(*)::int`,
          lancarCount: sql<number>`SUM(CASE WHEN ${setoranIqra.statusHafalan} = 'lanjut' THEN 1 ELSE 0 END)::int`,
        })
        .from(setoranIqra)
        .where(
          and(
            eq(setoranIqra.santriId, santriId),
            eq(setoranIqra.tenantId, tenantId),
            gte(setoranIqra.tanggalSetoran, awalBulanStr),
            lt(setoranIqra.tanggalSetoran, akhirBulanStr)
          )
        )

      // K3 (Progres Halaman)
      const getVolume = async (isBaseline: boolean) => {
        const startStr = isBaseline ? baselineAwalBulanStr : awalBulanStr
        const endStr = isBaseline ? awalBulanStr : akhirBulanStr
        const [res] = await db
          .select({
            volume: sql<number>`SUM(${setoranIqra.halamanAkhir} - ${setoranIqra.halamanAwal} + 1)::int`,
            countData: sql<number>`COUNT(*)::int`,
          })
          .from(setoranIqra)
          .where(
            and(
              eq(setoranIqra.santriId, santriId),
              eq(setoranIqra.tenantId, tenantId),
              gte(setoranIqra.tanggalSetoran, startStr),
              lt(setoranIqra.tanggalSetoran, endStr)
            )
          )
        return res
      }

      const volAktif = await getVolume(false)
      const volBaseline = await getVolume(true)

      // 4. Perhitungan Skor
      let skorAkhir = 0
      const flags = { coldStart3: false, noTargetHariSetoran: false }

      const bobotKualitas = 0.40
      const bobotKonsistensi = 0.30
      const bobotProgres = 0.20
      const bobotKelancaran = 0.10

      const breakdown = {
        kualitas: { skor: 0, bobot: bobotKualitas },
        konsistensi: { skor: 0, bobot: bobotKonsistensi },
        progres: { skor: 0, bobot: bobotProgres, coldStart: false },
        kelancaran: { skor: 0, bobot: bobotKelancaran }
      }

      // K1 Kualitas Bacaan
      const avgKualitas = kualitasKonsistensi?.avgSkorKualitas ? Number(kualitasKonsistensi.avgSkorKualitas) : 0
      breakdown.kualitas.skor = (avgKualitas / 5) * 100

      // K2 Konsistensi Setoran
      if (!targetHariSetoranPeriode || targetHariSetoranPeriode <= 0) {
        flags.noTargetHariSetoran = true
        breakdown.konsistensi.skor = 50 // Default for missing target
      } else {
        const hariUnik = kualitasKonsistensi?.hariUnikSetoran || 0
        breakdown.konsistensi.skor = Math.min(100, (hariUnik / targetHariSetoranPeriode) * 100)
      }

      // K3 Progres Halaman
      const isColdStart = volBaseline.countData === 0
      const volB = volBaseline.volume ? Number(volBaseline.volume) : 0
      const volA = volAktif.volume ? Number(volAktif.volume) : 0
      const avgBaseline = volB / 3
      const targetProgres = avgBaseline * diffMonths

      if (isColdStart || targetProgres === 0) {
        breakdown.progres.skor = 50
        breakdown.progres.coldStart = true
        flags.coldStart3 = true
      } else {
        breakdown.progres.skor = Math.min(100, (volA / targetProgres) * 100)
      }

      // K4 Kelancaran
      const totalSetoran = kualitasKonsistensi?.totalSetoran || 0
      const lancarCount = kualitasKonsistensi?.lancarCount || 0
      if (totalSetoran === 0) {
          breakdown.kelancaran.skor = 50
      } else {
          breakdown.kelancaran.skor = (lancarCount / totalSetoran) * 100
      }

      // Accumulate
      skorAkhir += breakdown.kualitas.skor * breakdown.kualitas.bobot
      skorAkhir += breakdown.konsistensi.skor * breakdown.konsistensi.bobot
      skorAkhir += breakdown.progres.skor * breakdown.progres.bobot
      skorAkhir += breakdown.kelancaran.skor * breakdown.kelancaran.bobot

      return success({
        skor: Math.round(skorAkhir),
        breakdown,
        flags,
        isIqra: true // useful for UI
      }, 'Berhasil menghitung Indeks Perkembangan Iqra')

    } catch (err) {
      return handleError(err)
    }
  })

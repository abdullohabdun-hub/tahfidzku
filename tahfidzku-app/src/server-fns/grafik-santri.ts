import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../db'
import { sql } from 'drizzle-orm'
import { getAuthSession } from '../middleware/auth.middleware'
import { AuthenticationError, NotFoundError } from '../lib/errors'
import { success, handleError } from '../lib/response'
import { verifyAksesSantri } from '../lib/authz'
import { getLegacyMingguMulaiKey } from '../lib/dateUtils'

export const getGrafikDanSummarySantri = createServerFn({ method: 'POST' })
  .validator(z.object({ santriId: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()

      // 1. OTORISASI & OWNERSHIP CHECK (Mencegah IDOR, berlaku untuk SEMUA role)
      const tenantId = await verifyAksesSantri(session, data.santriId)

      // 2. FETCH PROFIL SANTRI (Strict Tenant Isolation)
      const profil = await db.query.santri.findFirst({
        where: (s, { eq, and }) => and(eq(s.id, data.santriId), eq(s.tenantId, tenantId))
      })

      if (!profil) {
        throw new NotFoundError('Data santri')
      }

      // 3. IDENTIKKAN ZONA WAKTU MINGGU INI DENGAN TICKET 1
      const isoDateString = getLegacyMingguMulaiKey() // Match Ticket 1 bug for bug


      // 4. JALANKAN 3 QUERY SEKALIGUS
      const [grafikHarianResult, rasioMingguanResult, smartSummaryResult] = await Promise.all([
        // Query 1: Grafik 3-Series (Agregasi Harian 14 Hari di zona waktu WIB)
        db.execute(sql`
          SELECT 
            DATE(created_at AT TIME ZONE 'Asia/Jakarta') as tanggal,
            jenis,
            SUM(COALESCE(halaman_akhir - halaman_awal + 1, 0)) as total_halaman,
            COUNT(id) as total_setoran
          FROM setoran
          WHERE santri_id = ${profil.id} AND tenant_id = ${tenantId}
            AND (created_at AT TIME ZONE 'Asia/Jakarta') >= (NOW() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '14 days'
          GROUP BY DATE(created_at AT TIME ZONE 'Asia/Jakarta'), jenis
          ORDER BY DATE(created_at AT TIME ZONE 'Asia/Jakarta') ASC
        `),
        // Query 2: Rasio Mingguan (8 Minggu, Ziyadah vs Murojaah di zona waktu WIB)
        db.execute(sql`
          WITH raw_data AS (
            SELECT 
              DATE_TRUNC('week', created_at AT TIME ZONE 'Asia/Jakarta') as minggu,
              jenis,
              SUM(COALESCE(halaman_akhir - halaman_awal + 1, 0)) as total_halaman
            FROM setoran
            WHERE santri_id = ${profil.id} AND tenant_id = ${tenantId}
              AND (created_at AT TIME ZONE 'Asia/Jakarta') >= (NOW() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '8 weeks'
            GROUP BY DATE_TRUNC('week', created_at AT TIME ZONE 'Asia/Jakarta'), jenis
          )
          SELECT 
            minggu,
            SUM(CASE WHEN jenis = 'ziyadah' THEN total_halaman ELSE 0 END) as ziyadah_halaman,
            SUM(CASE WHEN jenis IN ('sabqi', 'manzil') THEN total_halaman ELSE 0 END) as murojaah_halaman
          FROM raw_data
          GROUP BY minggu
          ORDER BY minggu ASC
        `),
        // Query 3: Smart Summary (Join Setoran Minggu Ini dengan Rekap Absensi)
        db.execute(sql`
          WITH setoran_minggu_ini AS (
            SELECT 
              santri_id,
              COUNT(id) as total_setoran,
              SUM(COALESCE(halaman_akhir - halaman_awal + 1, 0)) as total_halaman
            FROM setoran
            WHERE santri_id = ${profil.id} AND tenant_id = ${tenantId}
              AND DATE_TRUNC('week', created_at AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('week', NOW() AT TIME ZONE 'Asia/Jakarta')
            GROUP BY santri_id
          )
          SELECT 
            s.total_setoran,
            s.total_halaman,
            r.total_hadir,
            r.total_izin,
            r.total_sakit,
            r.total_alpa,
            r.total_hadir_tanpa_setoran
          FROM setoran_minggu_ini s
          LEFT JOIN rekap_mingguan_santri r 
            ON r.santri_id = s.santri_id 
            AND r.minggu_mulai = ${isoDateString}::date
        `)
      ])

      // 5. MAPPING RESULT
      const grafikHarian = (grafikHarianResult.rows || (grafikHarianResult as any)).map((row: any) => ({
        tanggal: row.tanggal,
        jenis: row.jenis,
        totalHalaman: Number(row.total_halaman),
        totalSetoran: Number(row.total_setoran)
      }))

      const rasioMingguan = (rasioMingguanResult.rows || (rasioMingguanResult as any)).map((row: any) => ({
        minggu: row.minggu,
        ziyadahHalaman: Number(row.ziyadah_halaman),
        murojaahHalaman: Number(row.murojaah_halaman)
      }))

      const summaryRow = (smartSummaryResult.rows || (smartSummaryResult as any))[0]
      const smartSummary = {
        totalSetoran: summaryRow ? Number(summaryRow.total_setoran) : 0,
        totalHalaman: summaryRow ? Number(summaryRow.total_halaman) : 0,
        kehadiran: {
          hadir: summaryRow && summaryRow.total_hadir !== null ? Number(summaryRow.total_hadir) : 0,
          izin: summaryRow && summaryRow.total_izin !== null ? Number(summaryRow.total_izin) : 0,
          sakit: summaryRow && summaryRow.total_sakit !== null ? Number(summaryRow.total_sakit) : 0,
          alpa: summaryRow && summaryRow.total_alpa !== null ? Number(summaryRow.total_alpa) : 0,
          hadirTanpaSetoran: summaryRow && summaryRow.total_hadir_tanpa_setoran !== null ? Number(summaryRow.total_hadir_tanpa_setoran) : 0
        }
      }

      return success({
        grafikHarian,
        rasioMingguan,
        smartSummary
      }, "Data grafik dan summary berhasil dimuat")

    } catch (error) {
      return handleError(error)
    }
  })

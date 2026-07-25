import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../db'
import { sql } from 'drizzle-orm'
import { getAuthSession } from '../middleware/auth.middleware'
import { AuthenticationError, NotFoundError } from '../lib/errors'
import { success, handleError } from '../lib/response'
import { verifyAksesSantri } from '../lib/authz'

export const getPetaKualitasJuz = createServerFn({ method: 'POST' })
  .validator(z.object({ santriId: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()

      // Otorisasi dengan Helper Bersama
      const tenantId = await verifyAksesSantri(session, data.santriId)

      // Verifikasi keberadaan santri (konsisten dengan analitik.ts)
      const profil = await db.query.santri.findFirst({
        where: (s, { eq, and }) => and(eq(s.id, data.santriId), eq(s.tenantId, tenantId))
      })
      if (!profil) {
        throw new NotFoundError('Data santri')
      }

      // Eksekusi CTE 3 Lapis
      const petaResult = await db.execute(sql`
        WITH expanded_setoran AS (
          SELECT s.id, s.jenis, s.skor_kualitas, s.created_at, j.juz_num
          FROM setoran s
          JOIN generate_series(
            COALESCE(s.juz_mulai, s.juz),
            COALESCE(s.juz_selesai, s.juz)
          ) AS j(juz_num) ON true
          WHERE s.santri_id = ${data.santriId} AND s.tenant_id = ${tenantId}
        ),
        ziyadah_terakhir AS (
          SELECT DISTINCT ON (juz_num) juz_num, skor_kualitas, created_at AS tanggal_ziyadah_terakhir
          FROM expanded_setoran WHERE jenis = 'ziyadah'
          ORDER BY juz_num, created_at DESC
        ),
        murojaah_terakhir AS (
          SELECT juz_num, MAX(created_at) AS tanggal_murojaah_terakhir
          FROM expanded_setoran WHERE jenis IN ('sabqi', 'manzil')
          GROUP BY juz_num
        )
        SELECT z.juz_num, z.skor_kualitas, z.tanggal_ziyadah_terakhir,
               m.tanggal_murojaah_terakhir,
               CURRENT_DATE - m.tanggal_murojaah_terakhir::date AS hari_sejak_murojaah
        FROM ziyadah_terakhir z
        LEFT JOIN murojaah_terakhir m ON m.juz_num = z.juz_num
        ORDER BY z.juz_num;
      `)

      // Mapping hasil agar bentuk keys-nya konsisten camelCase untuk Frontend
      const rawRows = petaResult.rows || (petaResult as any)
      const peta = rawRows.map((row: any) => ({
        juzNum: row.juz_num,
        skorKualitas: row.skor_kualitas,
        tanggalZiyadahTerakhir: row.tanggal_ziyadah_terakhir,
        tanggalMurojaahTerakhir: row.tanggal_murojaah_terakhir,
        hariSejakMurojaah: row.hari_sejak_murojaah !== null ? Number(row.hari_sejak_murojaah) : null
      }))

      return success({ peta }, "Data peta kualitas juz berhasil dimuat")
    } catch (error) {
      return handleError(error)
    }
  })

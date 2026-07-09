import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, sql, gte, lt } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { setoran, santri, kelas, users } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError } from '../lib/errors'

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
      requireRole(session, 'admin_lembaga')

      // Hitung rentang tanggal (Awal bulan s/d awal bulan berikutnya)
      const startDate = new Date(data.year, data.month - 1, 1)
      const endDate = new Date(data.year, data.month, 1) // Hari pertama bulan berikutnya

      const reportData = await db
        .select({
          id: setoran.id,
          jenis: setoran.jenis,
          juz: setoran.juz,
          surah: setoran.surah,
          ayatAwal: setoran.ayatAwal,
          ayatAkhir: setoran.ayatAkhir,
          halamanAwal: setoran.halamanAwal,
          halamanAkhir: setoran.halamanAkhir,
          kualitas: setoran.kualitas,
          catatan: setoran.catatan,
          createdAt: setoran.createdAt,
          santriNama: santri.nama,
          kelasNama: kelas.nama,
          ustadzNama: users.nama,
        })
        .from(setoran)
        .innerJoin(santri, eq(setoran.santriId, santri.id))
        .leftJoin(kelas, eq(santri.kelasId, kelas.id))
        .innerJoin(users, eq(setoran.ustadzId, users.id))
        .where(
          and(
            eq(setoran.tenantId, session.user.tenantId),
            gte(setoran.createdAt, startDate),
            lt(setoran.createdAt, endDate)
          )
        )
        .orderBy(desc(setoran.createdAt))

      return success(reportData, 'Berhasil mengambil laporan bulanan')
    } catch (err) {
      return handleError(err)
    }
  })

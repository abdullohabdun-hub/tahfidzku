import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, gte } from 'drizzle-orm'
import { db } from '../db'
import { santri, setoran, users } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError } from '../lib/errors'

export const getAdminDashboardStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const tenantId = session.user.tenantId

      // 1. Total Santri
      const santriList = await db
        .select({ id: santri.id })
        .from(santri)
        .where(eq(santri.tenantId, tenantId))
      const totalSantri = santriList.length

      // 2. Total Ustadz
      const ustadzList = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.role, 'ustadz')))
      const totalUstadz = ustadzList.length

      // 3. Setoran Hari Ini
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const setoranHariIniList = await db
        .select({ id: setoran.id })
        .from(setoran)
        .where(
          and(
            eq(setoran.tenantId, tenantId),
            gte(setoran.createdAt, today)
          )
        )
      const totalSetoranHariIni = setoranHariIniList.length

      // 4. Setoran Terakhir (Limit 5)
      const recentSetoran = await db
        .select({
          id: setoran.id,
          jenis: setoran.jenis,
          surah: setoran.surah,
          ayatAwal: setoran.ayatAwal,
          ayatAkhir: setoran.ayatAkhir,
          juz: setoran.juz,
          halamanAwal: setoran.halamanAwal,
          halamanAkhir: setoran.halamanAkhir,
          kualitas: setoran.kualitas,
          createdAt: setoran.createdAt,
          santriNama: santri.nama,
        })
        .from(setoran)
        .innerJoin(santri, eq(setoran.santriId, santri.id))
        .where(eq(setoran.tenantId, tenantId))
        .orderBy(desc(setoran.createdAt))
        .limit(5)

      return success({
        totalSantri,
        totalUstadz,
        totalSetoranHariIni,
        recentSetoran,
      }, 'Berhasil mengambil statistik dashboard')
    } catch (err) {
      return handleError(err)
    }
  }
)

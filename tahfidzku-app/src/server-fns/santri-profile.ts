import { createServerFn } from '@tanstack/react-start'
import { and, eq, desc, gte } from 'drizzle-orm'
import { db } from '../db'
import { santri, kelas, setoran, setoranIqra } from '../db/schema'
import { getAuthSession } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { ForbiddenError, AuthenticationError } from '../lib/errors'

export const getSantriProfileDetail = createServerFn({ method: 'POST' })
  .validator((d: { santriId: string }) => d)
  .handler(async ({ data: { santriId } }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      
      // Explicit Allow-list Guard
      if (!['admin', 'ustadz'].includes(session.user.role)) {
        throw new ForbiddenError('Akses profil detail saat ini dibatasi untuk staf (Fase 1).')
      }

      const isUstadz = session.user.role === 'ustadz'

      // Ownership Check & Tenant Isolation
      const [profile] = await db.select({
        santri: santri,
        kelasNama: kelas.nama,
      }).from(santri)
        .leftJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(and(
          eq(santri.tenantId, session.user.tenantId),
          eq(santri.id, santriId),
          isUstadz ? eq(kelas.ustadzId, session.user.id) : undefined
        ))
        .limit(1)

      if (!profile) {
        throw new Error('Santri tidak ditemukan atau Anda tidak memiliki akses.')
      }

      const isIqra = profile.santri.tahapSantri === 'iqra'
      
      let distribusiSetoran = { ziyadah: 0, sabqi: 0, manzil: 0 }
      let trendNilai: any[] = []

      if (!isIqra) {
        const last30Days = new Date()
        last30Days.setDate(last30Days.getDate() - 30)
        const last30DaysStr = last30Days.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

        const recentSetoran = await db.query.setoran.findMany({
          where: and(
            eq(setoran.tenantId, session.user.tenantId),
            eq(setoran.santriId, santriId),
            gte(setoran.tanggalSetoran, last30DaysStr)
          )
        })

        recentSetoran.forEach(s => {
          if (s.jenis === 'ziyadah') distribusiSetoran.ziyadah++
          else if (s.jenis === 'sabqi') distribusiSetoran.sabqi++
          else if (s.jenis === 'manzil') distribusiSetoran.manzil++
        })

        // TODO: Map to actual trend chart for tahfidz scores
        trendNilai = recentSetoran.map(s => ({
          tanggal: s.tanggalSetoran,
          nilai: s.skorKualitas
        }))
      }

      return success({
        profil: profile.santri,
        kelasNama: profile.kelasNama,
        distribusiSetoran,
        trendNilai
      }, "Berhasil mengambil profil santri")

    } catch (err) {
      return handleError(err)
    }
  })

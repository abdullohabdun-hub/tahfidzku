import { createServerFn } from '@tanstack/react-start'
import { and, eq, desc, gte, inArray } from 'drizzle-orm'
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
      
      const isUstadz = session.user.role === 'ustadz'
      const isSantri = session.user.role === 'santri'

      if (!['admin', 'ustadz', 'santri'].includes(session.user.role)) {
        throw new ForbiddenError('Akses ditolak.')
      }

      // Ownership Check & Tenant Isolation
      const [profile] = await db.select({
        santri: santri,
        kelasNama: kelas.nama,
        tipeKelas: kelas.tipeKelas,
        kelasUstadzId: kelas.ustadzId,
      }).from(santri)
        .leftJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(and(
          eq(santri.tenantId, session.user.tenantId),
          eq(santri.id, santriId),
        ))
        .limit(1)

      if (!profile) {
        throw new ForbiddenError('Santri tidak ditemukan atau Anda tidak memiliki akses.')
      }

      if (isUstadz && profile.kelasUstadzId !== session.user.id) {
        throw new ForbiddenError('Santri tidak ditemukan atau Anda tidak memiliki akses.')
      }

      if (isSantri && session.user.santriId !== santriId && profile.santri.id !== santriId) {
        throw new ForbiddenError('Anda hanya dapat mengakses profil milik Anda sendiri.')
      }

      const isIqra = profile.santri.tahapSantri === 'iqra'
      
      let distribusiSetoran = { ziyadah: 0, sabqi: 0, manzil: 0 }
      let trendNilai: any[] = []
      let lastMurojaah = { lastSabqi: null as any, lastManzil: null as any }

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

        trendNilai = recentSetoran.map(s => ({
          tanggal: s.tanggalSetoran,
          nilai: s.skorKualitas
        }))

        const lastMurojaahList = await db
          .select({
            id: setoran.id,
            jenis: setoran.jenis,
            juz: setoran.juz,
            juzMulai: setoran.juzMulai,
            juzSelesai: setoran.juzSelesai,
            halamanAwal: setoran.halamanAwal,
            halamanAkhir: setoran.halamanAkhir,
            surah: setoran.surah,
            tanggalSetoran: setoran.tanggalSetoran,
            skorKualitas: setoran.skorKualitas,
            createdAt: setoran.createdAt,
          })
          .from(setoran)
          .where(
            and(
              eq(setoran.tenantId, session.user.tenantId),
              eq(setoran.santriId, santriId),
              inArray(setoran.jenis, ['sabqi', 'manzil'])
            )
          )
          .orderBy(desc(setoran.createdAt))

        lastMurojaah.lastSabqi = lastMurojaahList.find(s => s.jenis === 'sabqi') || null
        lastMurojaah.lastManzil = lastMurojaahList.find(s => s.jenis === 'manzil') || null
      }

      return success({
        profil: profile.santri,
        kelasNama: profile.kelasNama,
        tipeKelas: profile.tipeKelas,
        distribusiSetoran,
        trendNilai,
        lastMurojaah
      }, "Berhasil mengambil profil santri")

    } catch (err) {
      return handleError(err)
    }
  })

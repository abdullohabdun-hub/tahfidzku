import { createServerFn } from '@tanstack/react-start'
import { and, eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { santri, kelas, waliSantri, setoran, setoranIqra, absensi, sesiKelas, pengumuman, tenants } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { AuthenticationError } from '../lib/errors'
import { getSantriDisplayMode } from '../lib/santri-display'
import { getTodayWIB } from '../lib/dateUtils'

export const getWaliBeranda = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'wali')

      const tenantId = session.user.tenantId

      // Dapatkan daftar santri yang terhubung dengan wali
      let santriIds: string[] = []
      const anakLinks = await db.select({ santriId: waliSantri.santriId })
        .from(waliSantri)
        .where(
          and(
            eq(waliSantri.waliUserId, session.user.id),
            eq(waliSantri.tenantId, tenantId)
          )
        )
      
      if (anakLinks.length > 0) {
        santriIds = anakLinks.map(link => link.santriId)
      } else if (session.user.santriId) {
        santriIds = [session.user.santriId]
      }

      if (santriIds.length === 0) throw new Error('Akun Wali ini belum terhubung ke data anak (santri).')

      const today = getTodayWIB()

      // Ambil data highlight anak secara paralel
      const highlightAnakPromises = santriIds.map(async (santriId) => {
        const [profil] = await db.select().from(santri).where(and(eq(santri.id, santriId), eq(santri.tenantId, tenantId))).limit(1)
        if (!profil) return null

        let namaKelas = null
        if (profil.kelasId) {
          const [kelasObj] = await db.select({ nama: kelas.nama }).from(kelas).where(eq(kelas.id, profil.kelasId)).limit(1)
          if (kelasObj) namaKelas = kelasObj.nama
        }

        const displayMode = getSantriDisplayMode(profil)

        let capaianTerakhir = null

        // Cek status kehadiran hari ini (termasuk dari semua sesi hari ini)
        const [absensiHariIniObj] = await db.select({ status: absensi.status })
          .from(absensi)
          .innerJoin(sesiKelas, eq(absensi.sesiKelasId, sesiKelas.id))
          .where(
            and(
              eq(absensi.santriId, santriId),
              eq(sesiKelas.tanggal, today),
              eq(absensi.tenantId, tenantId)
            )
          )
          .orderBy(desc(absensi.createdAt))
          .limit(1)
        
        const statusAbsensi = absensiHariIniObj ? absensiHariIniObj.status : null

        if (displayMode === 'iqra') {
          const [lastSetoran] = await db.select()
            .from(setoranIqra)
            .where(eq(setoranIqra.santriId, santriId))
            .orderBy(desc(setoranIqra.createdAt))
            .limit(1)
          
          if (lastSetoran) {
            capaianTerakhir = `Jilid ${lastSetoran.jilid} Hal ${lastSetoran.halamanAkhir || lastSetoran.halamanAwal}`
          }
        } else {
          const [lastSetoran] = await db.select()
            .from(setoran)
            .where(eq(setoran.santriId, santriId))
            .orderBy(desc(setoran.createdAt))
            .limit(1)
          
          if (lastSetoran) {
            capaianTerakhir = `Juz ${lastSetoran.juz} Hal ${lastSetoran.halamanAkhir || lastSetoran.halamanAwal}`
          }
        }

        return {
          id: profil.id,
          nama: profil.nama,
          kelas: namaKelas,
          displayMode: displayMode as 'tahfidz' | 'iqra',
          capaianTerakhir,
          statusAbsensi
        }
      })

      // Promise pengumuman
      const pengumumanPromise = db.query.pengumuman.findMany({
        where: and(
          eq(pengumuman.tenantId, tenantId),
          eq(pengumuman.isAktif, true)
        ),
        orderBy: [desc(pengumuman.createdAt)],
        limit: 5
      })

      const tenantPromise = db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { namaLembaga: true }
      })

      const [highlightAnakResults, pengumumanList, tenantData] = await Promise.all([
        Promise.all(highlightAnakPromises),
        pengumumanPromise,
        tenantPromise
      ])

      const daftarAnak = highlightAnakResults.filter((a): a is NonNullable<typeof a> => a !== null)

      return {
        success: true,
        data: {
          namaWali: session.user.nama,
          namaLembaga: tenantData?.namaLembaga || 'Tahfidzku',
          daftarAnak,
          pengumuman: pengumumanList.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString()
          }))
        }
      }
    } catch (error: any) {
      console.error('[getWaliBeranda]', error)
      return { success: false, error: { message: error.message || 'Terjadi kesalahan' } }
    }
  }
)

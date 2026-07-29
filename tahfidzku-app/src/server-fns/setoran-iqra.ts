import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { setoranIqra, ujianIqra, santri } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { createSetoranIqraSchema, createUjianIqraSchema } from '../lib/validators'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ForbiddenError, NotFoundError } from '../lib/errors'
import { verifyAksesSantri } from '../lib/authz'

export const createSetoranIqra = createServerFn({ method: 'POST' })
  .validator(createSetoranIqraSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz') // Hanya ustadz yang boleh input setoran Iqra

      const tenantId = session.user.tenantId

      // Validasi: pastikan santri ada dan tahapannya iqra
      const [curSantri] = await db
        .select({ tahapSantri: santri.tahapSantri, nama: santri.nama })
        .from(santri)
        .where(and(eq(santri.id, data.santriId), eq(santri.tenantId, tenantId)))
        .limit(1)
        
      if (!curSantri) throw new NotFoundError('Santri tidak ditemukan')
      if (curSantri.tahapSantri !== 'iqra') {
        throw new ForbiddenError(`Santri ${curSantri.nama} tidak berada di tahap Iqra.`)
      }

      // Insert setoran Iqra
      const [newSetoran] = await db
        .insert(setoranIqra)
        .values({
          tenantId,
          santriId: data.santriId,
          sesiKelasId: data.sesiKelasId,
          jilid: data.jilid,
          halamanAwal: data.halamanAwal,
          halamanAkhir: data.halamanAkhir,
          skorKualitas: data.skorKualitas,
          statusHafalan: data.statusHafalan,
          catatan: data.catatan,
          createdBy: session.user.id,
        })
        .returning()

      // Update posisi santri
      await db
        .update(santri)
        .set({
          jilidIqraTerakhir: data.jilid,
          halamanIqraTerakhir: data.halamanAkhir,
        })
        .where(eq(santri.id, data.santriId))

      return success(newSetoran, 'Setoran Iqra berhasil disimpan')
    } catch (err: any) {
      return handleError(err)
    }
  })

export const createUjianIqra = createServerFn({ method: 'POST' })
  .validator(createUjianIqraSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz') // Hanya ustadz yang boleh menguji

      const tenantId = session.user.tenantId

      const [curSantri] = await db
        .select({ tahapSantri: santri.tahapSantri })
        .from(santri)
        .where(and(eq(santri.id, data.santriId), eq(santri.tenantId, tenantId)))
        .limit(1)

      if (!curSantri) throw new NotFoundError('Santri tidak ditemukan')
      if (curSantri.tahapSantri !== 'iqra') {
        throw new ForbiddenError('Santri tidak berada di tahap Iqra.')
      }

      const [newUjian] = await db
        .insert(ujianIqra)
        .values({
          tenantId,
          santriId: data.santriId,
          jilidDiuji: data.jilidDiuji,
          skor: data.skor,
          lulus: data.lulus,
          catatan: data.catatan,
          ujiOlehUstadzId: session.user.id,
        })
        .returning()

      if (data.lulus) {
        if (data.jilidDiuji === 6) {
          // Lulus jilid 6 -> Transisi ke tahfidz
          await db
            .update(santri)
            .set({
              tahapSantri: 'tahfidz',
              // Note: posisiTerakhir tahfidz tidak diisi otomatis,
              // biarkan mekanisme 'Atur Posisi Sekarang' yang berjalan.
            })
            .where(eq(santri.id, data.santriId))
        } else {
          // Lulus jilid < 6 -> Naik jilid, halaman 0 (sama seperti tahfidz ayat 0/1)
          await db
            .update(santri)
            .set({
              jilidIqraTerakhir: data.jilidDiuji + 1,
              halamanIqraTerakhir: 0, // 0 menandakan belum mulai halaman apapun di jilid baru
            })
            .where(eq(santri.id, data.santriId))
        }
      }

      return success(newUjian, 'Hasil ujian Iqra berhasil disimpan')
    } catch (err: any) {
      return handleError(err)
    }
  })

// Endpoints for Fetching History
// We reuse verifyAksesSantri from authz

export const getSetoranIqraSantri = createServerFn({ method: 'GET' })
  .validator((d: string) => d) // santriId
  .handler(async ({ data: santriId }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      
      await verifyAksesSantri(session, santriId)

      const riwayat = await db
        .select()
        .from(setoranIqra)
        .where(eq(setoranIqra.santriId, santriId))
        .orderBy(desc(setoranIqra.createdAt))

      return success(riwayat, 'Berhasil mengambil riwayat setoran Iqra')
    } catch (err: any) {
      return handleError(err)
    }
  })

export const getUjianIqraSantri = createServerFn({ method: 'GET' })
  .validator((d: string) => d) // santriId
  .handler(async ({ data: santriId }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()

      await verifyAksesSantri(session, santriId)

      const riwayat = await db
        .select()
        .from(ujianIqra)
        .where(eq(ujianIqra.santriId, santriId))
        .orderBy(desc(ujianIqra.tanggalUjian))

      return success(riwayat, 'Berhasil mengambil riwayat ujian Iqra')
    } catch (err: any) {
      return handleError(err)
    }
  })

// ???????????????????????????????????????????????????????
// NEW RPCs FOR PHASE 2 (REPORTING & DASHBOARD)
// ???????????????????????????????????????????????????????

export const getRiwayatIqraSantriSelf = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    const session = await getAuthSession()
    if (!session) throw new AuthenticationError()
    requireRole(session, 'santri')

    const santriId = session.user.santriId
    if (!santriId) throw new AuthenticationError('Akses ditolak: Bukan akun santri yang valid.')

    const setoranData = await db.query.setoranIqra.findMany({
      where: eq(setoranIqra.santriId, santriId),
      orderBy: [desc(setoranIqra.createdAt)],
      with: {
        createdBy: { columns: { nama: true } }
      }
    })

    const ujianData = await db.query.ujianIqra.findMany({
      where: eq(ujianIqra.santriId, santriId),
      orderBy: [desc(ujianIqra.tanggalUjian)],
      with: {
        ujiOlehUstadz: { columns: { nama: true } }
      }
    })

    const combined = [
      ...setoranData.map(s => ({ type: 'setoran' as const, date: s.createdAt, data: s, ustadzNama: s.createdBy?.nama })),
      ...ujianData.map(u => ({ type: 'ujian' as const, date: u.tanggalUjian, data: u, ustadzNama: u.ujiOlehUstadz?.nama }))
    ]

    combined.sort((a, b) => b.date.getTime() - a.date.getTime())

    return success(combined, 'Berhasil memuat riwayat Iqra santri')
  } catch (err) {
    return handleError(err)
  }
})

export const getRiwayatIqraUstadz = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    const session = await getAuthSession()
    if (!session) throw new AuthenticationError()
    requireRole(session, 'ustadz')

    const tenantId = session.user.tenantId
    const ustadzId = session.user.id

    // Note: Filter ini menggunakan pola tenantId + createdBy/ujiOlehUstadzId, sama seperti getSetoranRiwayat
    const setoranData = await db.query.setoranIqra.findMany({
      where: and(
        eq(setoranIqra.tenantId, tenantId),
        eq(setoranIqra.createdBy, ustadzId)
      ),
      orderBy: [desc(setoranIqra.createdAt)],
      limit: 50,
      with: {
        santri: { columns: { nama: true } }
      }
    })

    const ujianData = await db.query.ujianIqra.findMany({
      where: and(
        eq(ujianIqra.tenantId, tenantId),
        eq(ujianIqra.ujiOlehUstadzId, ustadzId)
      ),
      orderBy: [desc(ujianIqra.tanggalUjian)],
      limit: 50,
      with: {
        santri: { columns: { nama: true } }
      }
    })

    const combined = [
      ...setoranData.map(s => ({ type: 'setoran' as const, date: s.createdAt, data: s, santriNama: s.santri.nama })),
      ...ujianData.map(u => ({ type: 'ujian' as const, date: u.tanggalUjian, data: u, santriNama: u.santri.nama }))
    ]

    combined.sort((a, b) => b.date.getTime() - a.date.getTime())
    // Ambil top 50 saja dari gabungan
    const sliced = combined.slice(0, 50)

    return success(sliced, 'Berhasil memuat riwayat Iqra ustadz')
  } catch (err) {
    return handleError(err)
  }
})

export const getMonthlyReportIqra = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      year: z.number(),
      month: z.number()
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const startDate = new Date(data.year, data.month - 1, 1)
      const endDate = new Date(data.year, data.month, 1)
      const tenantId = session.user.tenantId

      const setoranData = await db.query.setoranIqra.findMany({
        where: (tbl, { eq, and, gte, lt }) => and(
          eq(tbl.tenantId, tenantId),
          gte(tbl.createdAt, startDate),
          lt(tbl.createdAt, endDate)
        ),
        orderBy: (tbl, { desc }) => [desc(tbl.createdAt)],
        with: {
          santri: {
            columns: { nama: true },
            with: { kelas: { columns: { nama: true } } }
          },
          createdBy: { columns: { nama: true } }
        }
      })

      const ujianData = await db.query.ujianIqra.findMany({
        where: (tbl, { eq, and, gte, lt }) => and(
          eq(tbl.tenantId, tenantId),
          gte(tbl.tanggalUjian, startDate),
          lt(tbl.tanggalUjian, endDate)
        ),
        orderBy: (tbl, { desc }) => [desc(tbl.tanggalUjian)],
        with: {
          santri: {
            columns: { nama: true },
            with: { kelas: { columns: { nama: true } } }
          },
          ujiOlehUstadz: { columns: { nama: true } }
        }
      })

      const combined = [
        ...setoranData.map(s => ({
          type: 'setoran' as const,
          date: s.createdAt,
          data: s,
          santriNama: s.santri?.nama || 'Unknown',
          kelasNama: s.santri?.kelas?.nama || 'Unknown',
          ustadzNama: s.createdBy?.nama || 'Unknown'
        })),
        ...ujianData.map(u => ({
          type: 'ujian' as const,
          date: u.tanggalUjian,
          data: u,
          santriNama: u.santri?.nama || 'Unknown',
          kelasNama: u.santri?.kelas?.nama || 'Unknown',
          ustadzNama: u.ujiOlehUstadz?.nama || 'Unknown'
        }))
      ]

      combined.sort((a, b) => b.date.getTime() - a.date.getTime())

      return success(combined, 'Berhasil mengambil laporan Iqra bulanan')
    } catch (err) {
      return handleError(err)
    }
  })

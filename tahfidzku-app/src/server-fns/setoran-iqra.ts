import { createServerFn } from '@tanstack/react-start'
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

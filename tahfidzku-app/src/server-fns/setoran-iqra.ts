import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { setoranIqra, ujianIqra, santri } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { createSetoranIqraSchema, createUjianIqraSchema } from '../lib/validators'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ForbiddenError, NotFoundError, ValidationError } from '../lib/errors'
import { verifyAksesSantri } from '../lib/authz'
import { getTodayWIB, parseDateString } from '../lib/dateUtils'

export const createSetoranIqra = createServerFn({ method: 'POST' })
  .validator(createSetoranIqraSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId // dari session server-side, BUKAN dari data

      return await db.transaction(async (tx) => {

        // 1. SELECT + FOR UPDATE — lock row santri selama transaksi berlangsung
        //    Mencegah race condition: dua request bersamaan meloloskan guard
        const lockResult = await tx.execute(sql`
          SELECT tahap_santri, nama, jilid_iqra_ujian_pending
          FROM santri
          WHERE id = ${data.santriId} AND tenant_id = ${tenantId}
          FOR UPDATE
        `)
        const curSantri = lockResult.rows[0] as { tahap_santri: string; nama: string; jilid_iqra_ujian_pending: number | null } | undefined

        if (!curSantri) throw new NotFoundError('Santri tidak ditemukan')
        if (curSantri.tahap_santri !== 'iqra') {
          throw new ForbiddenError(`Santri ${curSantri.nama} tidak berada di tahap Iqra.`)
        }

        // 2. Guard: tolak setoran jika ujian jilid sedang pending
        if (curSantri.jilid_iqra_ujian_pending !== null) {
          throw new ForbiddenError(
            `Santri ini masih menunggu Ujian Kenaikan Jilid ${curSantri.jilid_iqra_ujian_pending}. ` +
            `Selesaikan ujian terlebih dahulu sebelum melanjutkan setoran.`
          )
        }

        // 3. INSERT setoran Iqra — dalam transaksi yang sama
        const [newSetoran] = await tx
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
            tanggalSetoran: getTodayWIB(),
            createdBy: session.user.id,
          })
          .returning()

        // 4. UPDATE posisi santri + trigger pending — atomik dengan INSERT di atas
        //    Guard di atas sudah memastikan jilid_iqra_ujian_pending = null sebelum sampai sini.
        const newPending = data.halamanAkhir === 50 ? data.jilid : null
        await tx
          .update(santri)
          .set({
            jilidIqraTerakhir: data.jilid,
            halamanIqraTerakhir: data.halamanAkhir,
            jilidIqraUjianPending: newPending,
          })
          .where(eq(santri.id, data.santriId))

        return success(newSetoran, 'Setoran Iqra berhasil disimpan')
      })
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
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId // dari session server-side, BUKAN dari data
      const ustadzId = session.user.id

      return await db.transaction(async (tx) => {

        // 1. SELECT + FOR UPDATE — lock row santri selama transaksi berlangsung
        //    Mencegah race condition double-submit (double-klik / dua ustadz bersamaan)
        const lockResult = await tx.execute(sql`
          SELECT tahap_santri, jilid_iqra_ujian_pending, kelas_id
          FROM santri
          WHERE id = ${data.santriId} AND tenant_id = ${tenantId}
          FOR UPDATE
        `)
        const targetSantri = lockResult.rows[0] as { tahap_santri: string; jilid_iqra_ujian_pending: number | null; kelas_id: string | null } | undefined

        if (!targetSantri) throw new NotFoundError('Santri tidak ditemukan')
        if (targetSantri.tahap_santri !== 'iqra') {
          throw new ForbiddenError('Santri tidak berada di tahap Iqra.')
        }

        // 2. Validasi lapisan API — tidak bergantung pada UI
        if (targetSantri.jilid_iqra_ujian_pending === null) {
          throw new ValidationError(
            'Tidak ada ujian jilid yang sedang pending untuk santri ini. ' +
            'Kemungkinan sudah diproses oleh ustadz lain.'
          )
        }
        if (targetSantri.jilid_iqra_ujian_pending !== data.jilidDiuji) {
          throw new ValidationError(
            `Jilid yang diujikan (${data.jilidDiuji}) tidak sesuai dengan jilid pending ` +
            `(${targetSantri.jilid_iqra_ujian_pending}).`
          )
        }

        // 3. Hitung attempt — dalam transaksi yang sama (count sudah dikunci oleh FOR UPDATE)
        const sebelumnya = await tx
          .select({ id: ujianIqra.id })
          .from(ujianIqra)
          .where(and(
            eq(ujianIqra.santriId, data.santriId),
            eq(ujianIqra.jilidDiuji, data.jilidDiuji),
            eq(ujianIqra.tenantId, tenantId)
          ))
        const attempt = sebelumnya.length + 1

        // 4. INSERT hasil ujian
        const [newUjian] = await tx
          .insert(ujianIqra)
          .values({
            tenantId,
            santriId: data.santriId,
            jilidDiuji: data.jilidDiuji,
            skor: data.skor,
            lulus: data.lulus,
            catatan: data.catatan,
            ujiOlehUstadzId: ustadzId,
            attempt,
          })
          .returning()

        // 5. Update santri berdasarkan hasil — dalam transaksi yang sama
        if (data.lulus) {
          if (data.jilidDiuji === 6) {
            // Lulus jilid 6 → promosi ke tahfidz, clear pending
            await tx.update(santri)
              .set({ tahapSantri: 'tahfidz', jilidIqraUjianPending: null })
              .where(eq(santri.id, data.santriId))
          } else {
            // Lulus jilid < 6 → naik jilid, reset halaman, clear pending
            await tx.update(santri)
              .set({
                jilidIqraTerakhir: data.jilidDiuji + 1,
                halamanIqraTerakhir: 0,
                jilidIqraUjianPending: null,
              })
              .where(eq(santri.id, data.santriId))
          }
        }
        // Tidak lulus → jilidIqraUjianPending TIDAK diubah — santri tetap di antrean untuk retry

        return success(newUjian, 'Hasil ujian Iqra berhasil disimpan')
      })
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
      ...setoranData.map(s => ({ type: 'setoran' as const, date: s.tanggalSetoran, data: s, ustadzNama: s.createdBy?.nama })),
      ...ujianData.map(u => ({ type: 'ujian' as const, date: u.tanggalUjian, data: u, ustadzNama: u.ujiOlehUstadz?.nama }))
    ]

    combined.sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime())

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
      ...setoranData.map(s => ({ type: 'setoran' as const, date: s.tanggalSetoran, data: s, santriNama: s.santri.nama })),
      ...ujianData.map(u => ({ type: 'ujian' as const, date: u.tanggalUjian, data: u, santriNama: u.santri.nama }))
    ]

    combined.sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime())
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
          date: s.tanggalSetoran,
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

      combined.sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime())

      return success(combined, 'Berhasil mengambil laporan Iqra bulanan')
    } catch (err) {
      return handleError(err)
    }
  })

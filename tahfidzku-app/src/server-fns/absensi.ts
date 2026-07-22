import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, asc, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { absensi, sesiKelas, statusAbsensiEnum } from '../db/schema/absensi'
import { kelas, santri } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ForbiddenError, ValidationError } from '../lib/errors'
import { MAX_EDIT_AGE_MS } from '../lib/constants'

// ==========================================
// 0. GET KELAS YANG DIAMPU
// ==========================================
export const getKelasYangDiampu = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId
      const userId = session.user.id

      const daftarKelas = await db
        .select({
          id: kelas.id,
          nama: kelas.nama,
          hariPertemuan: kelas.hariPertemuan
        })
        .from(kelas)
        .where(and(eq(kelas.ustadzId, userId), eq(kelas.tenantId, tenantId)))
        .orderBy(asc(kelas.nama))

      return success(daftarKelas, 'Berhasil mengambil daftar kelas')
    } catch (err) {
      return handleError(err)
    }
  })

// ==========================================
// 1. BUKA SESI ABSENSI
// ==========================================
export const bukaSesiAbsensi = createServerFn({ method: 'POST' })
  .validator((d: unknown) => z.object({
    kelasId: z.string().uuid(),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD')
  }).parse(d))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId
      const userId = session.user.id

      // 1. Validasi otoritas ustadz pengampu kelas
      const [kelasTarget] = await db
        .select({ id: kelas.id, ustadzId: kelas.ustadzId, hariPertemuan: kelas.hariPertemuan })
        .from(kelas)
        .where(and(eq(kelas.id, data.kelasId), eq(kelas.tenantId, tenantId)))
        .limit(1)

      if (!kelasTarget) throw new ValidationError('Kelas tidak ditemukan')
      if (kelasTarget.ustadzId !== userId) {
        throw new ForbiddenError('Anda bukan pengampu kelas ini')
      }

      // 2. Pendekatan Catch Conflict (Anti Race Condition, Tanpa Transaction)
      let sesiId: string;
      try {
        const [newSesi] = await db.insert(sesiKelas).values({
          tenantId,
          kelasId: data.kelasId,
          tanggal: data.tanggal,
          createdBy: userId
        }).returning({ id: sesiKelas.id })
        sesiId = newSesi.id
      } catch (err: any) {
        // 23505 adalah kode PostgreSQL untuk unique_violation
        // Drizzle-Neon sering membungkus error asli di dalam property 'cause'
        const isDuplicate = err.code === '23505' || err?.cause?.code === '23505'
        
        if (isDuplicate) {
          const [existingSesi] = await db
            .select({ id: sesiKelas.id })
            .from(sesiKelas)
            .where(and(
              eq(sesiKelas.kelasId, data.kelasId),
              eq(sesiKelas.tanggal, data.tanggal)
            ))
            .limit(1)
          
          if (!existingSesi) {
            // Ini seharusnya tidak mungkin terjadi kecuali ada race condition yang aneh dengan DELETE
            throw new Error('Gagal mendapatkan sesi yang sudah ada')
          }
          sesiId = existingSesi.id
        } else {
          throw err // Lempar error lain jika bukan unique violation
        }
      }

      // 3. Ambil daftar santri di kelas tersebut
      const daftarSantri = await db
        .select({ id: santri.id, nama: santri.nama })
        .from(santri)
        .where(and(eq(santri.kelasId, data.kelasId), eq(santri.tenantId, tenantId)))
        .orderBy(asc(santri.nama))

      // 4. Ambil absensi yang sudah tersimpan untuk sesi ini (jika ada)
      const absensiTersimpan = await db
        .select({
          id: absensi.id,
          santriId: absensi.santriId,
          status: absensi.status,
          catatan: absensi.catatan
        })
        .from(absensi)
        .where(and(eq(absensi.sesiKelasId, sesiId), eq(absensi.tenantId, tenantId)))

      return success({
        sesiId,
        kelasTarget,
        daftarSantri,
        absensiTersimpan
      }, 'Berhasil membuka sesi absensi')
    } catch (err) {
      return handleError(err)
    }
  })


// ==========================================
// 2. SIMPAN ABSENSI
// ==========================================
export const simpanAbsensi = createServerFn({ method: 'POST' })
  .validator((d: unknown) => z.object({
    sesiKelasId: z.string().uuid(),
    daftarStatus: z.array(z.object({
      santriId: z.string().uuid(),
      status: z.enum(statusAbsensiEnum.enumValues),
      catatan: z.string().optional().nullable()
    }))
  }).parse(d))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId
      const userId = session.user.id

      // 1. Validasi sesi dan otoritas ustadz
      const [sesi] = await db
        .select({ id: sesiKelas.id, kelasId: sesiKelas.kelasId })
        .from(sesiKelas)
        .where(and(eq(sesiKelas.id, data.sesiKelasId), eq(sesiKelas.tenantId, tenantId)))
        .limit(1)

      if (!sesi) throw new ValidationError('Sesi tidak ditemukan')

      const [kelasTarget] = await db
        .select({ ustadzId: kelas.ustadzId })
        .from(kelas)
        .where(eq(kelas.id, sesi.kelasId))
        .limit(1)

      if (!kelasTarget || kelasTarget.ustadzId !== userId) {
        throw new ForbiddenError('Anda bukan pengampu kelas dari sesi ini')
      }

      // 2. Pre-flight Validation: Cek aturan edit 7 hari untuk data yang SUDAH ADA (semua atau tidak sama sekali)
      const existingAbsensi = await db
        .select({ santriId: absensi.santriId, createdAt: absensi.createdAt })
        .from(absensi)
        .where(eq(absensi.sesiKelasId, data.sesiKelasId))

      const existingMap = new Map(existingAbsensi.map(a => [a.santriId, a]))
      const santriTelatEdit: string[] = []

      for (const item of data.daftarStatus) {
        const old = existingMap.get(item.santriId)
        if (old && (Date.now() - new Date(old.createdAt).getTime() > MAX_EDIT_AGE_MS)) {
           santriTelatEdit.push(item.santriId)
        }
      }

      if (santriTelatEdit.length > 0) {
        throw new ForbiddenError(`Ada ${santriTelatEdit.length} data absensi yang sudah berusia lebih dari 7 hari dan tidak bisa diedit lagi. Operasi dibatalkan secara keseluruhan.`)
      }

      // 3. Lakukan iterasi untuk menyimpan masing-masing absensi santri
      for (const item of data.daftarStatus) {
        try {
          // Pendekatan Catch-Conflict: INSERT terlebih dahulu
          await db.insert(absensi).values({
            tenantId,
            sesiKelasId: data.sesiKelasId,
            santriId: item.santriId,
            status: item.status,
            catatan: item.catatan || null,
            createdBy: userId
          })
        } catch (err: any) {
          // Tangkap pelanggaran unique (23505) sebagai silent success dan fallback ke UPDATE
          const isDuplicate = err.code === '23505' || err?.cause?.code === '23505'
          
          if (isDuplicate) {
            const [oldData] = await db
              .select()
              .from(absensi)
              .where(and(
                eq(absensi.santriId, item.santriId),
                eq(absensi.sesiKelasId, data.sesiKelasId)
              ))
              .limit(1)

            if (oldData) {
              // Jika status atau catatan berbeda, baru update
              if (oldData.status !== item.status || oldData.catatan !== item.catatan) {
                const previousData = {
                  status: oldData.status,
                  catatan: oldData.catatan
                }
                await db.update(absensi)
                  .set({
                    status: item.status,
                    catatan: item.catatan || null,
                    updatedBy: userId,
                    previousData,
                    updatedAt: new Date()
                  })
                  .where(eq(absensi.id, oldData.id))
              }
            }
          } else {
            // Jika bukan 23505, lempar error betulan
            throw err
          }
        }
      }

      return success(null, 'Berhasil menyimpan absensi')
    } catch (err) {
      return handleError(err)
    }
  })


// ==========================================
// 3. GET RIWAYAT ABSENSI KELAS
// ==========================================
export const getRiwayatAbsensiKelas = createServerFn({ method: 'POST' })
  .validator((d: unknown) => z.object({
    kelasId: z.string().uuid(),
    limit: z.number().optional().default(30)
  }).parse(d))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId
      const userId = session.user.id

      // 1. [SECURITY] Validasi otoritas ustadz pengampu kelas (Mencegah IDOR)
      const [kelasTarget] = await db
        .select({ ustadzId: kelas.ustadzId, nama: kelas.nama })
        .from(kelas)
        .where(and(eq(kelas.id, data.kelasId), eq(kelas.tenantId, tenantId)))
        .limit(1)

      if (!kelasTarget) throw new ValidationError('Kelas tidak ditemukan')
      if (kelasTarget.ustadzId !== userId) {
        throw new ForbiddenError('Anda tidak memiliki akses ke riwayat kelas ini')
      }

      // 2. Ambil sesi kelas yang ada
      const listSesi = await db
        .select()
        .from(sesiKelas)
        .where(and(eq(sesiKelas.kelasId, data.kelasId), eq(sesiKelas.tenantId, tenantId)))
        .orderBy(desc(sesiKelas.tanggal))
        .limit(data.limit)

      if (listSesi.length === 0) {
        return success({ kelasNama: kelasTarget.nama, riwayat: [] }, 'Data riwayat kosong')
      }

      const sesiIds = listSesi.map(s => s.id)

      // 3. Ambil absensi untuk semua sesi tersebut
      const semuaAbsensi = await db
        .select({
          sesiKelasId: absensi.sesiKelasId,
          status: absensi.status
        })
        .from(absensi)
        .where(and(
          inArray(absensi.sesiKelasId, sesiIds),
          eq(absensi.tenantId, tenantId)
        ))

      // 4. Kelompokkan dan agregasi summary per sesi
      const riwayat = listSesi.map(s => {
        const absensiSesi = semuaAbsensi.filter(a => a.sesiKelasId === s.id)
        
        const summary = {
          total: absensiSesi.length,
          hadir: absensiSesi.filter(a => a.status === 'hadir').length,
          izin: absensiSesi.filter(a => a.status === 'izin').length,
          sakit: absensiSesi.filter(a => a.status === 'sakit').length,
          alpa: absensiSesi.filter(a => a.status === 'alpa').length,
          terlambat: absensiSesi.filter(a => a.status === 'terlambat').length,
        }

        return {
          id: s.id,
          tanggal: s.tanggal,
          createdAt: s.createdAt,
          summary
        }
      })

      return success({ kelasNama: kelasTarget.nama, riwayat }, 'Berhasil mengambil riwayat absensi')
    } catch (err) {
      return handleError(err)
    }
  })

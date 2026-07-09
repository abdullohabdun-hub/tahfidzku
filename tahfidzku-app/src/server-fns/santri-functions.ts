import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../db'
import { setoran, santri } from '../db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { getAuthSession, requireRole } from '../lib/session'
import { success, handleError } from '../lib/response'
import { AuthenticationError } from '../lib/errors'

// ═══════════════════════════════════════════════════════
// 1. MENDAPATKAN DATA DASHBOARD SANTRI
// ═══════════════════════════════════════════════════════
export const getSantriDashboardData = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      const santriId = session.user.santriId
      if (!santriId) throw new Error('Anda tidak memiliki profil santri.')

      const [profil] = await db.select().from(santri).where(eq(santri.id, santriId)).limit(1)

      // Ambil 5 riwayat terbaru
      const riwayat = await db
        .select()
        .from(setoran)
        .where(eq(setoran.santriId, santriId))
        .orderBy(desc(setoran.tanggal))
        .limit(5)

      // Hitung progress juz
      const targetJuz = profil?.targetJuz || 30
      const juzSelesai = profil?.juzProgress?.length || 0
      const progressPercentage = Math.round((juzSelesai / targetJuz) * 100)

      return success({
        profil,
        riwayat,
        progress: {
          targetJuz,
          juzSelesai,
          percentage: progressPercentage,
        },
        streak: 5, // Hardcoded for MVP display purposes
      })
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 2. INPUT MUROJAAH MANDIRI (OLEH SANTRI)
// ═══════════════════════════════════════════════════════
export const inputMurojaah = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      jenis: z.enum(['sabqi', 'manzil']),
      juz: z.number().min(1).max(30),
      halaman: z.number().min(1).max(604),
      suratNama: z.string(),
      ayat: z.string().optional(),
      kualitas: z.enum(['lancar', 'mengulang', 'terbata']),
      keterangan: z.string().optional(),
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      const santriId = session.user.santriId
      if (!santriId) throw new Error('Data santri tidak valid.')

      // Cari ustadz yang mengajar kelas santri ini (atau biarkan null jika tidak ada)
      // Untuk MVP, ustadzId wajib di skema setoran. Kita akan mencari ustadz yang ada di tenant ini.
      const ustadzList = await db.query.users.findMany({
        where: (users, { eq, and }) => and(eq(users.tenantId, session.user.tenantId), eq(users.role, 'ustadz')),
        limit: 1
      })
      const ustadzId = ustadzList.length > 0 ? ustadzList[0].id : session.user.id // Fallback

      const record = await db.insert(setoran).values({
        tenantId: session.user.tenantId,
        santriId: santriId,
        ustadzId: ustadzId,
        jenis: data.jenis,
        juz: data.juz,
        halaman: data.halaman,
        surat: data.suratNama,
        ayat: data.ayat || '-',
        kualitas: data.kualitas,
        keterangan: data.keterangan,
        tanggal: new Date(),
      }).returning()

      return success(record[0], 'Murojaah berhasil dilaporkan!')
    } catch (err) {
      return handleError(err)
    }
  })

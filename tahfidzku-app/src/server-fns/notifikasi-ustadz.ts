import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { notifikasiUstadz } from '../db/schema/notifikasi'
import { setoran } from '../db/schema/setoran'
import { eq, and, desc, isNull, sql } from 'drizzle-orm'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { handleError, success } from '../lib/response'
import { NotFoundError, ForbiddenError } from '../lib/errors'
import { z } from 'zod'

export const getUnreadCount = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) return 0
      if (session.user.role !== 'ustadz') return 0

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifikasiUstadz)
        .where(
          and(
            eq(notifikasiUstadz.tenantId, session.user.tenantId),
            eq(notifikasiUstadz.ustadzId, session.user.id),
            isNull(notifikasiUstadz.dibacaPada)
          )
        )

      return Number(result[0]?.count || 0)
    } catch (err) {
      console.error('Error getUnreadCount', err)
      return 0
    }
  })

export const getNotifikasi = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    const schema = z.object({
      cursor: z.number().default(0),
      limit: z.number().default(20)
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new Error('Unauthorized')
      requireRole(session, 'ustadz')

      const notifs = await db
        .select({
           notifikasi: notifikasiUstadz,
           setoran: setoran
        })
        .from(notifikasiUstadz)
        .leftJoin(setoran, eq(notifikasiUstadz.setoranId, setoran.id))
        .where(
          and(
            eq(notifikasiUstadz.tenantId, session.user.tenantId),
            eq(notifikasiUstadz.ustadzId, session.user.id)
          )
        )
        .orderBy(desc(notifikasiUstadz.dibuatPada))
        .limit(data.limit)
        .offset(data.cursor)

      const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(notifikasiUstadz)
        .where(
          and(
            eq(notifikasiUstadz.tenantId, session.user.tenantId),
            eq(notifikasiUstadz.ustadzId, session.user.id)
          )
        )
      
      const total = Number(totalResult[0]?.count || 0)
      const nextCursor = data.cursor + data.limit < total ? data.cursor + data.limit : null

      return success({ items: notifs, nextCursor }, 'Data notifikasi berhasil diambil')
    } catch (err) {
      return handleError(err)
    }
  })

export const tandaiDibaca = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      notifikasiId: z.string().uuid().optional() // Jika kosong, tandai semua
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new Error('Unauthorized')
      requireRole(session, 'ustadz')

      if (data.notifikasiId) {
        // Cek kepemilikan notifikasi (IDOR check)
        const targetNotif = await db.query.notifikasiUstadz.findFirst({
            where: eq(notifikasiUstadz.id, data.notifikasiId)
        })
        if (!targetNotif) throw new NotFoundError('Notifikasi tidak ditemukan')
        
        if (targetNotif.tenantId !== session.user.tenantId || targetNotif.ustadzId !== session.user.id) {
            throw new ForbiddenError('Anda tidak memiliki akses ke notifikasi ini')
        }

        await db.update(notifikasiUstadz)
          .set({ dibacaPada: new Date() })
          .where(eq(notifikasiUstadz.id, data.notifikasiId))
      } else {
        // Tandai semua dibaca untuk ustadz saat ini
        await db.update(notifikasiUstadz)
          .set({ dibacaPada: new Date() })
          .where(
             and(
               eq(notifikasiUstadz.tenantId, session.user.tenantId),
               eq(notifikasiUstadz.ustadzId, session.user.id),
               isNull(notifikasiUstadz.dibacaPada)
             )
          )
      }

      return success(null, 'Notifikasi berhasil ditandai dibaca')
    } catch (err) {
      return handleError(err)
    }
  })

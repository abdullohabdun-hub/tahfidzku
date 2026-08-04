import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../db'
import { notifikasiSantri } from '../db/schema/notifikasi'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { handleError, success } from '../lib/response'
import { AuthenticationError, ForbiddenError, NotFoundError } from '../lib/errors'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { setoran } from '../db/schema/setoran'

export const getNotifikasiSantri = createServerFn({ method: 'GET' })
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
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      if (!session.user.santriId) {
        throw new ForbiddenError('Akun santri tidak valid (tidak terhubung ke data santri)')
      }

      const notifs = await db.select({
           notifikasi: notifikasiSantri,
           setoranDetail: {
             id: setoran.id,
             jenis: setoran.jenis
           }
        })
        .from(notifikasiSantri)
        .leftJoin(setoran, eq(notifikasiSantri.setoranId, setoran.id))
        .where(
          and(
            eq(notifikasiSantri.tenantId, session.user.tenantId),
            eq(notifikasiSantri.santriId, session.user.santriId)
          )
        )
        .orderBy(desc(notifikasiSantri.dibuatPada))
        .limit(data.limit + 1)
        .offset(data.cursor)

      let nextCursor: number | undefined = undefined
      if (notifs.length > data.limit) {
        notifs.pop()
        nextCursor = data.cursor + data.limit
      }

      return success({ items: notifs, nextCursor }, 'Data notifikasi santri berhasil diambil')
    } catch (err) {
      return handleError(err)
    }
  })

export const tandaiDibacaSantri = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      notifikasiId: z.string().uuid().optional() // Jika kosong, tandai semua
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      if (!session.user.santriId) {
         throw new ForbiddenError('Akun santri tidak valid')
      }

      if (data.notifikasiId) {
        // IDOR checking + Update langsung
        await db.update(notifikasiSantri)
          .set({ dibacaPada: new Date() })
          .where(
             and(
               eq(notifikasiSantri.id, data.notifikasiId),
               eq(notifikasiSantri.tenantId, session.user.tenantId),
               eq(notifikasiSantri.santriId, session.user.santriId)
             )
          )
      } else {
        // Tandai semua
        await db.update(notifikasiSantri)
          .set({ dibacaPada: new Date() })
          .where(
             and(
               eq(notifikasiSantri.tenantId, session.user.tenantId),
               eq(notifikasiSantri.santriId, session.user.santriId),
               isNull(notifikasiSantri.dibacaPada)
             )
          )
      }

      return success(null, 'Notifikasi berhasil ditandai dibaca')
    } catch (err) {
      return handleError(err)
    }
  })

export const getUnreadCountSantri = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      setResponseHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      if (!session.user.santriId) return 0

      const result = await db.select({ id: notifikasiSantri.id })
        .from(notifikasiSantri)
        .where(
          and(
            eq(notifikasiSantri.tenantId, session.user.tenantId),
            eq(notifikasiSantri.santriId, session.user.santriId),
            isNull(notifikasiSantri.dibacaPada)
          )
        )
      return result.length
    } catch (e) {
      console.error('[getUnreadCountSantri] Gagal mengambil unread count:', e)
      return 0
    }
  })

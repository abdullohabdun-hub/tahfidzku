import { createServerFn } from '@tanstack/react-start'
import { eq, and, or, inArray, desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { tiket, tiketBalasan } from '../db/schema'
import { getSession } from '../lib/session'
import { success, handleError } from '../lib/response'

// --- Schemas ---

const createTiketSchema = z.object({
  subject: z.string().min(1, 'Subjek tidak boleh kosong').max(150, 'Subjek maksimal 150 karakter'),
  kategori: z.enum(['bug', 'fitur', 'pertanyaan', 'lainnya']),
  message: z.string().min(1, 'Pesan tidak boleh kosong').max(2000, 'Pesan maksimal 2000 karakter'),
})

const replyTiketSchema = z.object({
  tiketId: z.string().uuid(),
  pesan: z.string().min(1, 'Pesan tidak boleh kosong').max(2000, 'Pesan maksimal 2000 karakter'),
})

const updateTiketStatusSchema = z.object({
  tiketId: z.string().uuid(),
  status: z.enum(['baru', 'diproses', 'selesai']),
})

const getTiketListSchema = z.object({
  status: z.enum(['baru', 'diproses', 'selesai']).optional(),
})

const tiketIdSchema = z.object({
  id: z.string().uuid(),
})

// --- Helper Otorisasi ---

/**
 * Memastikan matriks visibilitas tiket.
 * - Superadmin: true (bisa lihat semua)
 * - Admin: true jika tiket miliknya sendiri ATAU (tenant sama & submitter adalah santri/wali/ustadz)
 * - Lainnya: true jika tiket miliknya sendiri
 */
function checkTiketAccess(t: { submitterId: string; submitterRole: string; tenantId: string }, sessionUser: any) {
  const isSuperadmin = sessionUser.id === process.env.SUPERADMIN_USER_ID
  if (isSuperadmin) return true

  if (sessionUser.role === 'admin') {
    if (t.submitterId === sessionUser.id) return true
    if (t.tenantId === sessionUser.tenantId && ['santri', 'wali', 'ustadz'].includes(t.submitterRole)) return true
    return false
  }

  return t.submitterId === sessionUser.id
}

// --- Server Functions ---

export const getTiketListFn = createServerFn({ method: 'POST' })
  .validator(getTiketListSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getSession()
      if (!session) throw new Error('Unauthorized')
      const { user } = session
      const isSuperadmin = user.id === process.env.SUPERADMIN_USER_ID

      let conditions = []
      
      if (data.status) {
        conditions.push(eq(tiket.status, data.status))
      }

      if (isSuperadmin) {
        // Superadmin melihat semua, tidak ada tambahan kondisi
      } else if (user.role === 'admin') {
        // Admin melihat miliknya ATAU (dari tenant-nya yang dibuat oleh santri/wali/ustadz)
        conditions.push(
          or(
            eq(tiket.submitterId, user.id),
            and(
              eq(tiket.tenantId, user.tenantId),
              inArray(tiket.submitterRole, ['santri', 'wali', 'ustadz'])
            )
          )
        )
      } else {
        // Santri/Wali/Ustadz hanya melihat miliknya sendiri
        conditions.push(eq(tiket.submitterId, user.id))
      }

      const list = await db.select().from(tiket).where(and(...conditions)).orderBy(desc(tiket.updatedAt))
      return success(list, 'Berhasil memuat tiket')
    } catch (err) {
      return handleError(err)
    }
  })

export const getTiketDetailFn = createServerFn({ method: 'POST' })
  .validator(tiketIdSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getSession()
      if (!session) throw new Error('Unauthorized')

      const [t] = await db.select().from(tiket).where(eq(tiket.id, data.id)).limit(1)
      if (!t) throw new Error('Tiket tidak ditemukan')

      // IDOR Protection melalui Helper Otorisasi Matriks
      if (!checkTiketAccess(t, session.user)) {
        throw new Error('Anda tidak memiliki akses ke tiket ini')
      }

      const thread = await db.select().from(tiketBalasan).where(eq(tiketBalasan.tiketId, data.id)).orderBy(tiketBalasan.createdAt)

      return success({ tiket: t, balasan: thread }, 'Detail tiket dimuat')
    } catch (err) {
      return handleError(err)
    }
  })

export const createTiketFn = createServerFn({ method: 'POST' })
  .validator(createTiketSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getSession()
      if (!session) throw new Error('Unauthorized')
      const { user } = session

      // Untuk rate-limiting yg aman
      const { sql } = require('drizzle-orm')
      const [countRes] = await db.select({ count: sql<number>`count(*)` }).from(tiket).where(
        and(
          eq(tiket.submitterId, user.id),
          sql`${tiket.createdAt} > NOW() - INTERVAL '15 minutes'`
        )
      )
      
      if (countRes && Number(countRes.count) >= 3) {
        throw new Error('Anda telah membuat terlalu banyak tiket. Silakan coba lagi dalam 15 menit.')
      }

      // Trust Boundary: Data diisi 100% dari session
      const [newTiket] = await db.insert(tiket).values({
        tenantId: user.tenantId,
        submitterId: user.id,
        submitterRole: user.role, // role dari session
        kategori: data.kategori,
        subject: data.subject,
        message: data.message,
        status: 'baru',
      }).returning()

      return success(newTiket, 'Tiket berhasil dibuat')
    } catch (err) {
      return handleError(err)
    }
  })

export const replyTiketFn = createServerFn({ method: 'POST' })
  .validator(replyTiketSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getSession()
      if (!session) throw new Error('Unauthorized')
      const { user } = session

      const [t] = await db.select().from(tiket).where(eq(tiket.id, data.tiketId)).limit(1)
      if (!t) throw new Error('Tiket tidak ditemukan')

      // IDOR Protection
      if (!checkTiketAccess(t, user)) {
        throw new Error('Anda tidak memiliki akses ke tiket ini')
      }

      const isSuperadmin = user.id === process.env.SUPERADMIN_USER_ID
      const authorRole = isSuperadmin ? 'superadmin' : user.role

      const [balasanBaru] = await db.insert(tiketBalasan).values({
        tiketId: t.id,
        authorId: user.id,
        authorRole: authorRole as any, // di-cast karena superadmin enum khusus
        pesan: data.pesan,
      }).returning()

      // Update waktu updatedAt di tiket utama
      await db.update(tiket).set({ updatedAt: new Date() }).where(eq(tiket.id, t.id))

      return success(balasanBaru, 'Balasan berhasil dikirim')
    } catch (err) {
      return handleError(err)
    }
  })

export const updateTiketStatusFn = createServerFn({ method: 'POST' })
  .validator(updateTiketStatusSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getSession()
      if (!session) throw new Error('Unauthorized')
      const { user } = session

      const [t] = await db.select().from(tiket).where(eq(tiket.id, data.tiketId)).limit(1)
      if (!t) throw new Error('Tiket tidak ditemukan')

      const isSuperadmin = user.id === process.env.SUPERADMIN_USER_ID

      if (isSuperadmin) {
        // Superadmin bebas mengubah status
      } else if (user.role === 'admin') {
        // Admin hanya boleh ubah tiket dari tenant-nya dengan submitterRole (santri/wali/ustadz)
        if (t.tenantId !== user.tenantId) {
          throw new Error('Anda tidak berhak mengubah tiket dari tenant lain')
        }
        if (!['santri', 'wali', 'ustadz'].includes(t.submitterRole)) {
          throw new Error('Anda tidak berhak mengubah status tiket ini')
        }
      } else {
        throw new Error('Anda tidak berhak mengubah status tiket')
      }

      await db.update(tiket).set({ status: data.status, updatedAt: new Date() }).where(eq(tiket.id, t.id))
      return success(null, 'Status tiket berhasil diubah')
    } catch (err) {
      return handleError(err)
    }
  })

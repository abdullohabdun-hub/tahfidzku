import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { users } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'

// ==========================================
// USTADZ CRUD (ADMIN ONLY)
// ==========================================

export const getUstadzList = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const ustadzList = await db.query.users.findMany({
        where: and(eq(users.tenantId, session.user.tenantId), eq(users.role, 'ustadz')),
        orderBy: [desc(users.createdAt)],
        columns: {
          id: true,
          nama: true,
          email: true,
          createdAt: true,
        }
      })

      return success(ustadzList, 'Berhasil mengambil daftar ustadz')
    } catch (err) {
      return handleError(err)
    }
  }
)

export const createUstadz = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({
    nama: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().min(1, 'Username/Email wajib diisi'),
    password: z.string().min(4, 'PIN/Password minimal 4 karakter')
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const existing = await db.query.users.findFirst({
        where: eq(users.email, data.email),
        columns: { id: true }
      })
      if (existing) throw new ValidationError('Username/Email sudah terdaftar')

      const passwordHash = data.password 

      const newUser = await db.insert(users).values({
        tenantId: session.user.tenantId,
        nama: data.nama,
        email: data.email,
        passwordHash,
        role: 'ustadz'
      }).returning({ id: users.id, nama: users.nama })

      return success(newUser[0], 'Berhasil menambahkan Ustadz')
    } catch (err) {
      return handleError(err)
    }
  })

export const deleteUstadz = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      await db.delete(users).where(and(eq(users.id, data.id), eq(users.tenantId, session.user.tenantId)))
      return success(null, 'Berhasil menghapus Ustadz')
    } catch (err) {
      return handleError(err)
    }
  })

export const updateUstadz = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({
    id: z.string(),
    nama: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().min(1, 'Username/Email wajib diisi'),
    password: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const existing = await db.query.users.findFirst({
        where: eq(users.email, data.email),
        columns: { id: true }
      })
      
      if (existing && existing.id !== data.id) throw new ValidationError('Username/Email sudah terdaftar')

      const updateData: any = { nama: data.nama, email: data.email }
      if (data.password) updateData.passwordHash = data.password

      await db.update(users).set(updateData).where(and(eq(users.id, data.id), eq(users.tenantId, session.user.tenantId)))
      
      return success(null, 'Berhasil menyimpan Ustadz')
    } catch (err) {
      return handleError(err)
    }
  })

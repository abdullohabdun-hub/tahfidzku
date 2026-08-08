import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { users, kelas } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'
import { normalisasiEmail, normalisasiNoWa, normalisasiUsername } from '../lib/string-utils'

// ==========================================
// USTADZ CRUD (ADMIN ONLY)
// ==========================================

export const getUstadzList = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const ustadzList = await db.query.users.findMany({
        where: and(eq(users.tenantId, session.user.tenantId), sql`${users.roles} @> ARRAY['ustadz']::user_role[]`),
        orderBy: [desc(users.createdAt)],
        columns: {
          id: true,
          nama: true,
          username: true,
          email: true,
          noWa: true,
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
    username: z.string().min(1, 'Username wajib diisi'),
    email: z.string().optional().nullable(),
    noWa: z.string().optional().nullable(),
    password: z.string().min(4, 'PIN/Password minimal 4 karakter'),
    roles: z.array(z.enum(['ustadz', 'admin'])).min(1, 'Pilih minimal satu role').default(['ustadz'])
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const username = normalisasiUsername(data.username);
      const email = data.email ? normalisasiEmail(data.email) : null;
      const noWa = data.noWa ? normalisasiNoWa(data.noWa) : null;

      // Check uniqueness (DB will also enforce this, but good to give clean errors)
      const existing = await db.query.users.findFirst({
        where: or(
          eq(users.username, username),
          email ? eq(users.email, email) : undefined,
          noWa ? eq(users.noWa, noWa) : undefined
        ),
        columns: { id: true }
      })
      if (existing) throw new ValidationError('Username / Email / No WA sudah terdaftar oleh pengguna lain.')

      const passwordHash = data.password 

      const newUser = await db.insert(users).values({
        tenantId: session.user.tenantId,
        nama: data.nama,
        username,
        email,
        noWa,
        passwordHash,
        role: data.roles.includes('admin') && data.roles[0] === 'admin' ? 'admin' : 'ustadz', // default active role
        roles: data.roles
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
    username: z.string().min(1, 'Username wajib diisi'),
    email: z.string().optional().nullable(),
    noWa: z.string().optional().nullable(),
    password: z.string().optional(),
    roles: z.array(z.enum(['ustadz', 'admin'])).min(1, 'Pilih minimal satu role').default(['ustadz'])
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const username = normalisasiUsername(data.username);
      const email = data.email ? normalisasiEmail(data.email) : null;
      const noWa = data.noWa ? normalisasiNoWa(data.noWa) : null;

      const existing = await db.query.users.findFirst({
        where: or(
          eq(users.username, username),
          email ? eq(users.email, email) : undefined,
          noWa ? eq(users.noWa, noWa) : undefined
        ),
        columns: { id: true }
      })
      
      if (existing && existing.id !== data.id) throw new ValidationError('Username / Email / No WA sudah terdaftar oleh pengguna lain.')

      const updateData: any = { nama: data.nama, username, email, noWa, roles: data.roles }
      if (data.password) updateData.passwordHash = data.password

      await db.update(users).set(updateData).where(and(eq(users.id, data.id), eq(users.tenantId, session.user.tenantId)))
      
      return success(null, 'Berhasil menyimpan Ustadz')
    } catch (err) {
      return handleError(err)
    }
  })

export const getUstadzProfile = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const halaqoh = await db.query.kelas.findFirst({
        where: and(eq(kelas.tenantId, session.user.tenantId), eq(kelas.ustadzId, session.user.id))
      })

      return success({ user: session.user, halaqoh: halaqoh || null }, 'Berhasil mengambil profil ustadz')
    } catch (err) {
      return handleError(err)
    }
  }
)

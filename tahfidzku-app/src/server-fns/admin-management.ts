import { createServerFn } from '@tanstack/react-start'
import { eq, and, ne, sql, count } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '../db'
import { users } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'
import { normalisasiEmail, normalisasiNoWa, normalisasiUsername } from '../lib/string-utils'

const createAdminSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter').max(255),
  email: z.string().email('Format email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter').max(255),
  noWa: z.string().min(9, 'Nomor WA minimal 9 digit').max(50),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
})

export const getAdminsFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // 🔴 Eksplisit menggunakan session.user.tenantId
      const tenantId = session.user.tenantId

      const adminList = await db
        .select({
          id: users.id,
          nama: users.nama,
          username: users.username,
          email: users.email,
          isActive: users.isActive,
          createdAt: users.createdAt,
          createdByAdminId: users.createdByAdminId
        })
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.role, 'admin')
          )
        )
        .orderBy(users.createdAt)

      return success(adminList, 'Berhasil mengambil daftar admin')
    } catch (err) {
      return handleError(err)
    }
  })

export const createAdminFn = createServerFn({ method: 'POST' })
  .validator(createAdminSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // 🔴 Eksplisit menggunakan session.user.tenantId
      const tenantId = session.user.tenantId
      const currentUserId = session.user.id

      // 1. Rate Limiting Sederhana via Postgres
      // Mencegah pembuatan lebih dari 10 admin dalam 1 jam
      const [rateLimitCheck] = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.role, 'admin'),
            sql`${users.createdAt} > NOW() - INTERVAL '1 hour'`
          )
        )
      
      if (rateLimitCheck && rateLimitCheck.count >= 10) {
        throw new ValidationError('Terlalu banyak permintaan pembuatan admin. Silakan coba lagi nanti.')
      }

      const normUsername = normalisasiUsername(data.username)
      const normEmail = normalisasiEmail(data.email)
      const normNoWa = normalisasiNoWa(data.noWa)

      // 2. Cek Duplikasi Global
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(
          sql`${users.username} = ${normUsername} OR ${users.email} = ${normEmail} OR ${users.noWa} = ${normNoWa}`
        )
        .limit(1)

      if (existingUser) {
        throw new ValidationError('Username, Email, atau Nomor WA sudah digunakan di sistem.')
      }

      // 3. Hash Password dengan bcrypt (reuse existing logic)
      const passwordHash = await bcrypt.hash(data.password, 10)

      // 4. Insert Admin Baru
      await db.insert(users).values({
        tenantId,
        nama: data.nama,
        username: normUsername,
        email: normEmail,
        noWa: normNoWa,
        passwordHash,
        role: 'admin',
        isActive: true,
        createdByAdminId: currentUserId,
        forcePasswordChange: true // Wajib ganti password di login pertama
      })

      return success(null, 'Berhasil menambahkan admin baru')
    } catch (err) {
      return handleError(err)
    }
  })

export const deactivateAdminFn = createServerFn({ method: 'POST' })
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: targetAdminId }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // 🔴 Eksplisit menggunakan session.user.tenantId
      const tenantId = session.user.tenantId
      const currentUserId = session.user.id

      // Guard 1: Tidak bisa nonaktifkan diri sendiri
      if (currentUserId === targetAdminId) {
        throw new ValidationError('Anda tidak dapat menonaktifkan akun Anda sendiri.')
      }

      // Pastikan target admin ada dan di tenant yang sama (Isolasi Tenant)
      const [targetAdmin] = await db
        .select({ id: users.id, isActive: users.isActive })
        .from(users)
        .where(
          and(
            eq(users.id, targetAdminId),
            eq(users.tenantId, tenantId),
            eq(users.role, 'admin')
          )
        )
        .limit(1)

      if (!targetAdmin) {
        throw new ValidationError('Admin tidak ditemukan atau tidak berada di lembaga Anda.')
      }

      if (!targetAdmin.isActive) {
        throw new ValidationError('Admin ini sudah dinonaktifkan sebelumnya.')
      }

      // Guard 2: Tidak bisa nonaktifkan admin aktif terakhir (Gunakan Transaction & Row Lock)
      await db.transaction(async (tx) => {
        // Kunci baris-baris admin yang sedang aktif di tenant ini agar tidak ada race condition
        const activeAdmins = await tx
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.tenantId, tenantId),
              eq(users.role, 'admin'),
              eq(users.isActive, true)
            )
          )
          .for('update')
          
        if (activeAdmins.length <= 1) {
          throw new ValidationError('Anda tidak dapat menonaktifkan admin terakhir yang aktif di lembaga ini.')
        }

        // Eksekusi penonaktifan (Soft Disable)
        await tx
          .update(users)
          .set({ isActive: false })
          .where(eq(users.id, targetAdminId))
      })

      return success(null, 'Admin berhasil dinonaktifkan')
    } catch (err) {
      return handleError(err)
    }
  })

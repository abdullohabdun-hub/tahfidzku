import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { users, santri } from '../db/schema'
import { impersonationLogs } from '../db/schema/impersonation'
import { waliSantri } from '../db/schema/wali-santri'
import { getAuthSession } from '../middleware/auth.middleware'
import { createSession, clearSession } from '../lib/session'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ForbiddenError } from '../lib/errors'
import type { SessionUser } from '../middleware/auth.middleware'

// ==========================================
// 1. MULAI IMPERSONATE (ADMIN SAJA)
// ==========================================
export const impersonateUser = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({
    targetRole: z.enum(['ustadz', 'santri', 'wali']),
    targetId: z.string().uuid('ID target tidak valid')
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()

      const user = session.user

      // 1. Validasi pemanggil adalah admin murni
      if (user.role !== 'admin') {
        throw new ForbiddenError('Hanya Admin yang dapat menggunakan fitur ini')
      }

      // 2. Tolak nested impersonation
      if (user.originalAdminId) {
        throw new ForbiddenError('Tidak dapat melakukan impersonate beruntun. Silakan kembali ke admin terlebih dahulu.')
      }

      // 3. Tolak target admin
      if (data.targetRole as string === 'admin') {
        throw new ForbiddenError('Tidak diizinkan meng-impersonate Admin lain')
      }

      let newSessionUser: SessionUser;

      // 4. Siapkan Data Sesi Target
      if (data.targetRole === 'ustadz') {
        const [targetUser] = await db.select().from(users).where(eq(users.id, data.targetId)).limit(1)
        if (!targetUser) throw new Error('Data Ustadz tidak ditemukan')
        
        newSessionUser = {
          id: targetUser.id,
          tenantId: targetUser.tenantId,
          nama: targetUser.nama,
          email: targetUser.email,
          username: targetUser.username,
          noWa: targetUser.noWa,
          role: 'ustadz',
        }
      } else if (data.targetRole === 'santri') {
        const [targetSantri] = await db.select().from(santri).where(eq(santri.id, data.targetId)).limit(1)
        if (!targetSantri) throw new Error('Data Santri tidak ditemukan')
        
        newSessionUser = {
          id: targetSantri.id, // Gunakan santri.id sebagai id sementara
          tenantId: targetSantri.tenantId,
          nama: targetSantri.nama,
          email: null,
          username: null,
          noWa: null,
          role: 'santri',
          santriId: targetSantri.id,
        }
      } else if (data.targetRole === 'wali') {
        const [link] = await db.select({ waliUserId: waliSantri.waliUserId }).from(waliSantri).where(eq(waliSantri.santriId, data.targetId)).limit(1)
        if (!link) throw new Error('Data Wali tidak ditemukan untuk Santri ini')
        
        const [targetWali] = await db.select().from(users).where(eq(users.id, link.waliUserId)).limit(1)
        if (!targetWali) throw new Error('Data Akun Wali tidak ditemukan')
        
        newSessionUser = {
          id: targetWali.id,
          tenantId: targetWali.tenantId,
          nama: targetWali.nama,
          email: targetWali.email,
          username: targetWali.username,
          noWa: targetWali.noWa,
          role: 'wali',
        }
      } else {
        throw new Error('Role target tidak valid')
      }

      // 5. Catat Log Audit
      const [log] = await db.insert(impersonationLogs).values({
        tenantId: user.tenantId,
        adminId: user.id,
        targetRole: data.targetRole as any,
        targetId: data.targetId,
      }).returning({ id: impersonationLogs.id })

      // 6. Sisipkan Meta Impersonate
      newSessionUser.originalAdminId = user.id
      newSessionUser.impersonationLogId = log.id
      newSessionUser.impersonateExpiresAt = Date.now() + 60 * 60 * 1000 // 60 menit

      const requestHost = getRequest()?.headers.get('host') ?? undefined

      // 7. Buat Sesi Baru
      await createSession(newSessionUser, 60, requestHost) // TTL 60 menit

      const targetUrl = `/${data.targetRole}`
      return success({ redirectUrl: targetUrl }, `Berhasil menyamar sebagai ${newSessionUser.nama}`)
    } catch (err) {
      return handleError(err)
    }
  })

// ==========================================
// 2. HENTIKAN IMPERSONATE (KEMBALI KE ADMIN)
// ==========================================
export const stopImpersonating = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()

      const user = session.user
      const originalAdminId = user.originalAdminId
      const logId = user.impersonationLogId

      if (!originalAdminId) {
        throw new Error('Tidak sedang dalam mode menyamar')
      }

      // 1. Verifikasi ulang hak admin di database (mencegah privilege escalation)
      const [adminData] = await db.select().from(users).where(eq(users.id, originalAdminId)).limit(1)
      
      if (!adminData || adminData.role !== 'admin') {
        clearSession() // Hancurkan sesi
        throw new AuthenticationError('Akses Admin Anda telah dicabut atau akun tidak ditemukan. Silakan login kembali.')
      }

      // 2. Update Log Audit
      if (logId) {
        await db.update(impersonationLogs)
          .set({ endedAt: new Date() })
          .where(eq(impersonationLogs.id, logId))
      }

      // 3. Pulihkan Sesi Admin
      const adminSessionUser: SessionUser = {
        id: adminData.id,
        tenantId: adminData.tenantId,
        nama: adminData.nama,
        email: adminData.email,
        username: adminData.username,
        noWa: adminData.noWa,
        role: 'admin',
      }
      
      const requestHost = getRequest()?.headers.get('host') ?? undefined
      await createSession(adminSessionUser, 7 * 24 * 60, requestHost) // Sesi normal 7 hari
      
      return success({ redirectUrl: '/admin' }, 'Berhasil kembali ke Admin')
    } catch (err) {
      return handleError(err)
    }
  })

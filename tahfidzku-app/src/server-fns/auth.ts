// src/server-fns/auth.ts
// Server Functions untuk Autentikasi (Login & Logout)

import { createServerFn } from '@tanstack/react-start'
import { eq, or, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../db'
import { users, tenants } from '../db/schema'
import { createSession, clearSession, getSession } from '../lib/session'
import { loginSchema, changePasswordSchema } from '../lib/validators'
import { success, handleError } from '../lib/response'
import { AuthenticationError } from '../lib/errors'
import { normalisasiEmail, normalisasiNoWa, normalisasiUsername } from '../lib/string-utils'

// ═══════════════════════════════════════════════════════
// 1. LOGIN (Membuat Session)
// ═══════════════════════════════════════════════════════
export const login = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    try {
      const identifier = data.identifier
      
      const [user] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.email, normalisasiEmail(identifier)),
            eq(users.noWa, normalisasiNoWa(identifier)),
            eq(users.username, normalisasiUsername(identifier))
          )
        )
        .limit(1)

      // Jika user tidak ditemukan
      if (!user) {
        throw new AuthenticationError('Data pengguna tidak ditemukan.')
      }

      // 🔴 Verifikasi Password (PIN) 🔴
      let isPasswordValid = false
      if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
        isPasswordValid = await bcrypt.compare(data.password, user.passwordHash)
      } else {
        isPasswordValid = user.passwordHash === data.password
      }

      if (!isPasswordValid) {
         throw new AuthenticationError('Nomor HP/Email/Username atau PIN Anda kurang tepat.')
      }

      // ── Cek Status Tenant & Bypass Superadmin ──
      if (user.id !== process.env.SUPERADMIN_USER_ID) {
        const [tenantData] = await db
          .select({ status: tenants.status })
          .from(tenants)
          .where(eq(tenants.id, user.tenantId))
          .limit(1)

        if (tenantData?.status === 'pending') {
          throw new AuthenticationError('Akun Anda masih dalam proses verifikasi oleh admin. Mohon tunggu konfirmasi via Email.')
        }
        
        if (tenantData?.status === 'rejected') {
          throw new AuthenticationError('Pendaftaran Anda tidak disetujui. Silakan hubungi admin untuk informasi lebih lanjut.')
        }

        if (tenantData?.status === 'suspend') {
          throw new AuthenticationError('Akses lembaga ini sedang ditangguhkan. Hubungi administrator lembaga Anda.')
        }
      }

      // ── Buat Session JWT ──
      await createSession({
        id: user.id,
        tenantId: user.tenantId,
        nama: user.nama,
        email: user.email,
        username: user.username,
        noWa: user.noWa,
        role: user.role,
        santriId: user.santriId,
      })

      console.log('✅ Login berhasil untuk:', user.nama, '(', user.role, ')')
      return success({ role: user.role }, 'Berhasil masuk')
    } catch (err) {
      console.error('❌ Login Error:', err)
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 2. LOGOUT (Menghapus Session)
// ═══════════════════════════════════════════════════════
export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    clearSession()
    return success(null, 'Berhasil keluar')
  } catch (err) {
    return handleError(err)
  }
})

// ═══════════════════════════════════════════════════════
// 3. CHECK AUTH (Mendapatkan Session Aktif)
// ═══════════════════════════════════════════════════════
export const checkAuth = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  return {
    ...session.user,
    isSuperAdmin: session.user.id === process.env.SUPERADMIN_USER_ID
  }
})

// ═══════════════════════════════════════════════════════
// 4. CHANGE PASSWORD
// ═══════════════════════════════════════════════════════
export const changePassword = createServerFn({ method: 'POST' })
  .validator(changePasswordSchema)
  .handler(async ({ data }) => {
    try {
      const session = await getSession()
      if (!session) throw new AuthenticationError('Anda harus login untuk mengubah password.')
      
      const userId = session.user.id
      const role = session.user.role

      // Server-side length validation based on role
      if (['admin', 'ustadz'].includes(role) && data.newPassword.length < 8) {
        throw new Error('Untuk keamanan, password Admin dan Ustadz minimal 8 karakter.')
      }
      if (['santri', 'wali'].includes(role) && data.newPassword.length < 4) {
        throw new Error('Password minimal 4 karakter.')
      }

      // Ambil data user
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user) throw new Error('User tidak ditemukan.')

      const now = new Date()

      // Rate Limiting Check
      if (user.lockedUntil && user.lockedUntil > now) {
        const diffMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (1000 * 60))
        throw new Error(`Akun terkunci sementara karena terlalu banyak percobaan. Coba lagi dalam ${diffMinutes} menit.`)
      }

      // Verifikasi Password Lama
      let isPasswordValid = false
      if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
        isPasswordValid = await bcrypt.compare(data.oldPassword, user.passwordHash)
      } else {
        isPasswordValid = user.passwordHash === data.oldPassword
      }

      if (!isPasswordValid) {
        // Failed attempt - atomic increment
        const [updatedUser] = await db.update(users)
          .set({ failedPasswordAttempts: sql`${users.failedPasswordAttempts} + 1` })
          .where(eq(users.id, userId))
          .returning({ failedPasswordAttempts: users.failedPasswordAttempts })
        
        if (updatedUser.failedPasswordAttempts >= 5) {
          const lockTime = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes
          await db.update(users)
            .set({ lockedUntil: lockTime })
            .where(eq(users.id, userId))
          throw new Error('Terlalu banyak percobaan gagal. Akun dikunci selama 15 menit.')
        }

        throw new Error('Password lama salah.')
      }

      // Password benar, proses pembaruan
      const newPasswordHash = await bcrypt.hash(data.newPassword, 10)

      await db.update(users)
        .set({ 
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
          failedPasswordAttempts: 0,
          lockedUntil: null
        })
        .where(eq(users.id, userId))
      
      // Regenerate session supaya device saat ini tidak ter-logout
      // Karena getSession mengandalkan cookies, kita panggil createSession() untuk nimpa JWT lama
      await createSession(session.user)

      return success(null, 'Password berhasil diubah.')
    } catch (err) {
      return handleError(err)
    }
  })

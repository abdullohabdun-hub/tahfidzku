// src/server-fns/auth.ts
// Server Functions untuk Autentikasi (Login & Logout)

import { createServerFn } from '@tanstack/react-start'
import { eq, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../db'
import { users, tenants } from '../db/schema'
import { createSession, clearSession, getSession } from '../lib/session'
import { loginSchema } from '../lib/validators'
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

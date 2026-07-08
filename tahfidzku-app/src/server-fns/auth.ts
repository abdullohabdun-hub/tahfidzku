// src/server-fns/auth.ts
// Server Functions untuk Autentikasi (Login & Logout)

import { createServerFn } from '@tanstack/react-start'
import { eq, or } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { createSession, clearSession, getSession } from '../lib/session'
import { loginSchema } from '../lib/validators'
import { success, handleError } from '../lib/response'
import { AuthenticationError } from '../lib/errors'

// ═══════════════════════════════════════════════════════
// 1. LOGIN (Membuat Session)
// ═══════════════════════════════════════════════════════
export const login = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    try {
      // ── Cari user berdasarkan email / no HP (di MVP ini kita pakai email/no hp di kolom email) ──
      // Catatan: Pada versi MVP, password adalah PIN 6 digit atau sandi sederhana
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1)

      // Jika user tidak ditemukan
      if (!user) {
        throw new AuthenticationError('Data pengguna tidak ditemukan.')
      }

      // ── Verifikasi Password (PIN) ──
      // PERHATIAN: Di produksi nyata, gunakan bcrypt/argon2 untuk mencocokkan hash.
      // Karena ini MVP sederhana, kita asumsikan sandi masih plain/sederhana sesuai kesepakatan (PIN statis)
      // Nanti akan diubah menjadi verifikasi hash.
      if (user.passwordHash !== data.password) {
         throw new AuthenticationError('Nomor HP/Email atau PIN Anda kurang tepat.')
      }

      // ── Buat Session JWT ──
      await createSession({
        id: user.id,
        tenantId: user.tenantId,
        nama: user.nama,
        email: user.email,
        role: user.role,
        santriId: user.santriId,
      })

      console.log('✅ Login berhasil untuk:', user.email)
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
export const checkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()
  if (!session) return null
  return session.user
})

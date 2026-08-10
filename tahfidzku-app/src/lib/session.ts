// src/lib/session.ts
// Utilitas untuk mengelola JWT Session Cookie

import { SignJWT, jwtVerify } from 'jose'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import type { SessionUser } from '../middleware/auth.middleware'

const secretKey = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'tahfidzku_jwt_fallback_secret_key_2026_production_safe'
const encodedKey = new TextEncoder().encode(secretKey)

const SESSION_COOKIE_NAME = 'tahfidzku_session'

// Membuat token JWT dari data user
export async function createSession(user: SessionUser, ttlMinutes: number = 7 * 24 * 60) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

  const sessionToken = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(encodedKey)

  // Menyimpan token ke cookie browser dengan error handling
  try {
    setCookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })
  } catch (err) {
    console.error('[SessionCookieError] Failed to set cookie:', err)
  }
}

// Membaca dan memverifikasi token JWT dari cookie
export async function getSession(): Promise<{ user: SessionUser } | null> {
  const sessionToken = getCookie(SESSION_COOKIE_NAME)
  if (!sessionToken) return null

  try {
    const { payload } = await jwtVerify(sessionToken, encodedKey, {
      algorithms: ['HS256'],
    })

    // Validasi Sesi: Cek apakah password sudah diganti setelah token ini dibuat, cek aktif, dan cek forcePasswordChange
    const userId = payload.id as string
    const [userRecord] = await db.select({ 
      passwordChangedAt: users.passwordChangedAt,
      isActive: users.isActive,
      forcePasswordChange: users.forcePasswordChange 
    }).from(users).where(eq(users.id, userId)).limit(1)
    
    if (userRecord) {
      if (!userRecord.isActive) {
        return null // Akun dinonaktifkan
      }
      if (userRecord.passwordChangedAt && payload.iat) {
        // iat adalah detik, getTime adalah milidetik
        // Kita tolak token jika dibuat (iat) sebelum password diubah
        if (payload.iat * 1000 < userRecord.passwordChangedAt.getTime()) {
          return null // Token revoked
        }
      }
    }

    // Pastikan tipe data sesuai dengan SessionUser
    return {
      user: {
        id: payload.id as string,
        tenantId: payload.tenantId as string,
        nama: payload.nama as string,
        email: (payload.email as string) || null,
        username: (payload.username as string) || null,
        noWa: (payload.noWa as string) || null,
        role: payload.role as SessionUser['role'],
        roles: (payload.roles as SessionUser['roles']) || undefined,
        santriId: (payload.santriId as string) || null,
        originalAdminId: (payload.originalAdminId as string) || undefined,
        impersonationLogId: (payload.impersonationLogId as string) || undefined,
        impersonateExpiresAt: (payload.impersonateExpiresAt as number) || undefined,
        forcePasswordChange: userRecord ? userRecord.forcePasswordChange : (payload.forcePasswordChange as boolean | undefined),
      },
    }
  } catch (error) {
    // Jika token kadaluarsa atau tidak valid (dimodifikasi)
    return null
  }
}

// Menghapus sesi (Logout)
export function clearSession() {
  deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
}

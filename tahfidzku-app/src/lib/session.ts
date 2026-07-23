// src/lib/session.ts
// Utilitas untuk mengelola JWT Session Cookie

import { SignJWT, jwtVerify } from 'jose'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import type { SessionUser } from '../middleware/auth.middleware'

const secretKey = process.env.AUTH_SECRET
if (!secretKey) {
  throw new Error('AUTH_SECRET is not defined in .env')
}
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

  // Menyimpan token ke cookie browser
  setCookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

// Membaca dan memverifikasi token JWT dari cookie
export async function getSession(): Promise<{ user: SessionUser } | null> {
  const sessionToken = getCookie(SESSION_COOKIE_NAME)
  if (!sessionToken) return null

  try {
    const { payload } = await jwtVerify(sessionToken, encodedKey, {
      algorithms: ['HS256'],
    })

    // Validasi Sesi: Cek apakah password sudah diganti setelah token ini dibuat
    const userId = payload.id as string
    const [userRecord] = await db.select({ passwordChangedAt: users.passwordChangedAt }).from(users).where(eq(users.id, userId)).limit(1)
    
    if (userRecord && userRecord.passwordChangedAt && payload.iat) {
      // iat adalah detik, getTime adalah milidetik
      // Kita tolak token jika dibuat (iat) sebelum password diubah
      if (payload.iat * 1000 < userRecord.passwordChangedAt.getTime()) {
        return null // Token revoked
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
        santriId: (payload.santriId as string) || null,
        originalAdminId: (payload.originalAdminId as string) || undefined,
        impersonationLogId: (payload.impersonationLogId as string) || undefined,
        impersonateExpiresAt: (payload.impersonateExpiresAt as number) || undefined,
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

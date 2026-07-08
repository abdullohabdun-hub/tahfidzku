// src/lib/session.ts
// Utilitas untuk mengelola JWT Session Cookie

import { SignJWT, jwtVerify } from 'jose'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import type { SessionUser } from '../middleware/auth.middleware'

const secretKey = process.env.AUTH_SECRET
if (!secretKey) {
  throw new Error('AUTH_SECRET is not defined in .env')
}
const encodedKey = new TextEncoder().encode(secretKey)

const SESSION_COOKIE_NAME = 'tahfidzku_session'

// Membuat token JWT dari data user
export async function createSession(user: SessionUser) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 hari

  const sessionToken = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
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

    // Pastikan tipe data sesuai dengan SessionUser
    return {
      user: {
        id: payload.id as string,
        tenantId: payload.tenantId as string,
        nama: payload.nama as string,
        email: payload.email as string,
        role: payload.role as SessionUser['role'],
        santriId: (payload.santriId as string) || null,
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

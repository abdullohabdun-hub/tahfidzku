import type { Role } from '../lib/constants'
import { getSession } from '../lib/session'

export type SessionUser = {
  id: string
  tenantId: string
  nama: string
  email: string
  role: Role
  santriId?: string | null
}

export type Session = {
  user: SessionUser
} | null

/**
 * Mengambil session user saat ini dari request context.
 * Membaca token JWT dari cookie menggunakan fungsi getSession() di lib/session.ts
 */
export async function getAuthSession(): Promise<Session> {
  return await getSession()
}

/**
 * Memastikan user memiliki salah satu role yang diizinkan.
 * Melempar ForbiddenError (atau Error biasa jika menggunakan helper format) jika tidak sesuai.
 */
export function requireRole(session: Session, ...allowedRoles: Role[]): void {
  if (!session) {
    throw new Error('UNAUTHENTICATED')
  }
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('FORBIDDEN')
  }
}


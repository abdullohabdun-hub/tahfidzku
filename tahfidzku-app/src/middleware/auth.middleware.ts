import type { Role } from '../lib/constants'
import { getSession } from '../lib/session'
import { AuthenticationError, ForbiddenError } from '../lib/errors'

export type SessionUser = {
  id: string
  tenantId: string
  nama: string
  email: string | null
  username: string | null
  noWa: string | null
  role: Role
  santriId?: string | null
  originalAdminId?: string
  impersonationLogId?: string
  impersonateExpiresAt?: number
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
    throw new AuthenticationError()
  }
  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError()
  }
}

/**
 * Memastikan user adalah Super Admin (berdasarkan UUID dari environment).
 * Tidak bergantung pada kolom 'role' atau 'tenant.status'.
 */
export function requireSuperAdmin(session: Session): void {
  if (!session) {
    throw new AuthenticationError()
  }
  if (session.user.id !== process.env.SUPERADMIN_USER_ID) {
    throw new ForbiddenError()
  }
}

/**
 * Middleware TanStack Start: memastikan request memiliki session aktif.
 * Meng-inject `user` ke context agar handler bisa mengaksesnya via `context.user`.
 * Cara pakai: `.middleware([requireAuth])`
 */
export async function requireAuth() {
  const session = await getAuthSession()
  if (!session) {
    throw new AuthenticationError()
  }
  return {
    user: session.user,
  }
}

/**
 * Memastikan user memiliki salah satu role yang diizinkan pada tenant ini.
 * Dipanggil dari handler setelah `requireAuth` mengisi `context.user`.
 */
export function requireTenantRole(user: SessionUser, allowedRoles: Role[]): void {
  if (!user) {
    throw new AuthenticationError()
  }
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError()
  }
}


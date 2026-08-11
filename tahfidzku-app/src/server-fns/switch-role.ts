import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { users, auditLogs } from '../db/schema'
import { getAuthSession } from '../middleware/auth.middleware'
import { createSession } from '../lib/session'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ForbiddenError } from '../lib/errors'
import type { Role } from '../lib/constants'

export const switchRoleFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ targetRole: z.enum(['admin', 'ustadz']) }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()

      const { tenantId, id: userId, role: fromRole } = session.user

      // 1. Ambil userId dan tenantId dari session server-side
      // 2. Query ulang ke database untuk ambil users.roles terbaru
      const [userDb] = await db
        .select({ roles: users.roles })
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId) // Guard IDOR
          )
        )
        .limit(1)

      if (!userDb) throw new AuthenticationError('User tidak ditemukan')
      
      const rolesArray = userDb.roles || []
      
      // 3. Validasi targetRole ada di dalam roles hasil query DB
      if (!rolesArray.includes(data.targetRole as any)) {
        throw new ForbiddenError('Akses ditolak: Anda tidak memiliki role tersebut.')
      }

      const requestHost = getRequest()?.headers.get('host') ?? undefined

      // 4. Re-issue session dengan role baru
      await createSession({
        ...session.user,
        role: data.targetRole as Role,
        roles: rolesArray as Role[],
      }, 7 * 24 * 60, requestHost)

      // 5. Tulis audit log
      await db.insert(auditLogs).values({
        tenantId,
        userId,
        action: 'SWITCH_ROLE',
        details: { fromRole, toRole: data.targetRole }
      })

      // 6. Return redirect URL
      const redirectUrl = data.targetRole === 'admin' ? '/admin' : '/ustadz'
      
      return success({ redirectUrl }, `Berhasil beralih ke mode ${data.targetRole}`)
    } catch (err) {
      return handleError(err)
    }
  })

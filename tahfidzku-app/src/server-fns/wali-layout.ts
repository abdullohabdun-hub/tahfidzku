import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { tenants } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { AuthenticationError } from '../lib/errors'

export const getWaliLayout = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'wali')

      const tenantData = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
        columns: { namaLembaga: true }
      })

      return {
        success: true,
        data: {
          namaLembaga: tenantData?.namaLembaga || 'Tahfidzku'
        }
      }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  }
)

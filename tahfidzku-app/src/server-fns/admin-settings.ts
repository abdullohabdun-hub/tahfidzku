import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { tenants } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'

export const getTenantInfo = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin_lembaga')

      const result = await db
        .select({
          id: tenants.id,
          namaLembaga: tenants.namaLembaga,
          slug: tenants.slug,
        })
        .from(tenants)
        .where(eq(tenants.id, session.user.tenantId))
        .limit(1)

      if (result.length === 0) throw new ValidationError('Data lembaga tidak ditemukan')

      return success(result[0], 'Berhasil mengambil info lembaga')
    } catch (err) {
      return handleError(err)
    }
  }
)

export const updateTenantInfo = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      namaLembaga: z.string().min(3, 'Nama lembaga minimal 3 karakter')
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin_lembaga')

      await db
        .update(tenants)
        .set({ namaLembaga: data.namaLembaga })
        .where(eq(tenants.id, session.user.tenantId))

      return success(null, 'Berhasil memperbarui pengaturan lembaga')
    } catch (err) {
      return handleError(err)
    }
  })

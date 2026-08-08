import { ForbiddenError } from './errors'
import { getAuthSession } from '../middleware/auth.middleware'

type Session = NonNullable<Awaited<ReturnType<typeof getAuthSession>>>

export async function verifyAksesSantri(session: Session, santriId: string) {
  const { role, tenantId, santriId: sessionSantriId } = session.user
  if (role === 'santri') {
    if (santriId !== sessionSantriId) {
      throw new ForbiddenError('Anda tidak berhak mengakses data santri ini.')
    }
  } else if (role === 'wali') {
    if (santriId !== sessionSantriId) {
      // Cek tabel junction wali_santri untuk multi-anak
      const { db } = await import('../db')
      const { waliSantri } = await import('../db/schema')
      const { and, eq } = await import('drizzle-orm')
      const [link] = await db
        .select({ id: waliSantri.id })
        .from(waliSantri)
        .where(
          and(
            eq(waliSantri.waliUserId, session.user.id),
            eq(waliSantri.santriId, santriId),
            eq(waliSantri.tenantId, tenantId)
          )
        )
        .limit(1)
        
      if (!link) {
        throw new ForbiddenError('Anda tidak berhak mengakses data santri ini.')
      }
    }
  } else if (role !== 'ustadz' && role !== 'admin') {
    throw new ForbiddenError('Role tidak diizinkan.')
  }
  return tenantId
}

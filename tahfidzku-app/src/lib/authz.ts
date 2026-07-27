import { ForbiddenError } from './errors'
import { getAuthSession } from '../middleware/auth.middleware'

type Session = NonNullable<Awaited<ReturnType<typeof getAuthSession>>>

export async function verifyAksesSantri(session: Session, santriId: string) {
  const { role, tenantId, santriId: sessionSantriId } = session.user
  if (role === 'santri' || role === 'wali') {
    if (santriId !== sessionSantriId) {
      throw new ForbiddenError('Anda tidak berhak mengakses data santri ini.')
    }
  } else if (role !== 'ustadz' && role !== 'admin') {
    throw new ForbiddenError('Role tidak diizinkan.')
  }
  return tenantId
}

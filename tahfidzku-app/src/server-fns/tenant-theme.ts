import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { put } from '@vercel/blob'
import { db } from '../db'
import { tenants } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'

export const uploadTenantLogo = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // GUARDS BY DESIGN: tenantId diambil HANYA dari session user
      const tenantId = session.user.tenantId

      const file = data.get('file') as File | null

      if (!file || typeof file === 'string') {
        throw new ValidationError('File logo wajib diunggah')
      }

      // Validasi tipe file (SVG sengaja tidak diizinkan demi keamanan XSS)
      const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new ValidationError('Tipe file tidak valid. Hanya PNG, JPEG, dan WebP yang diizinkan.')
      }

      // Validasi ukuran file (maksimal 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new ValidationError('Ukuran file logo tidak boleh melebihi 2MB.')
      }

      // Tentukan ekstensi & path deterministik agar logo baru otomatis menimpa yang lama
      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1] || 'png'
      const blobPath = `logos/${tenantId}/logo.${ext}`

      // Upload ke Vercel Blob — access 'public' wajib, addRandomSuffix: false agar overwrite terjadi
      const blob = await put(blobPath, file, {
        access: 'public',
        addRandomSuffix: false,
      })

      // Simpan URL logo ke DB tenant
      await db
        .update(tenants)
        .set({ logoUrl: blob.url })
        .where(eq(tenants.id, tenantId))

      return success({ logoUrl: blob.url }, 'Logo lembaga berhasil diunggah')
    } catch (err) {
      return handleError(err)
    }
  }
)

export const updateTenantTheme = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      themeColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid. Gunakan hex 6 digit (contoh: #047857).'),
      themePreset: z.string().max(50).nullable().optional(),
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // GUARDS BY DESIGN: tenantId diambil HANYA dari session user
      const tenantId = session.user.tenantId

      await db
        .update(tenants)
        .set({
          themeColor: data.themeColor,
          themePreset: data.themePreset ?? null,
          themeConfigured: true, // Flag aktifkan safe-injection di dashboard
        })
        .where(eq(tenants.id, tenantId))

      return success(null, 'Pengaturan tema lembaga berhasil disimpan')
    } catch (err) {
      return handleError(err)
    }
  })

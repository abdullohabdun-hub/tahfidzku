import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { rubrikPenilaian, rubrikOpsi } from '../db/schema'
import { requireAuth, requireTenantRole } from '../middleware/auth.middleware'
import { sql } from 'drizzle-orm'

export const getRubrikAktif = createServerFn({ method: 'GET' })
  .handler(async () => {
    const context = await requireAuth()
    const { tenantId } = context.user

    // Ambil semua rubrik yang aktif beserta opsinya
    const rubriks = await db.query.rubrikPenilaian.findMany({
      where: and(
        eq(rubrikPenilaian.tenantId, tenantId),
        eq(rubrikPenilaian.aktif, true)
      ),
      orderBy: (r, { asc }) => [asc(r.urutan)],
      with: {
        opsi: {
          orderBy: (o, { asc }) => [asc(o.urutan)]
        }
      }
    })

    return rubriks
  })

export const getAllRubrikTenant = createServerFn({ method: 'GET' })
  .handler(async () => {
    const context = await requireAuth()
    const { tenantId } = context.user

    // Ambil semua rubrik beserta opsinya tanpa peduli aktif/tidak
    const rubriks = await db.query.rubrikPenilaian.findMany({
      where: eq(rubrikPenilaian.tenantId, tenantId),
      orderBy: (r, { asc }) => [asc(r.urutan)],
      with: {
        opsi: {
          orderBy: (o, { asc }) => [asc(o.urutan)]
        }
      }
    })

    return rubriks
  })

const rubrikSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  opsi: z.array(z.object({
    id: z.string().uuid().optional(),
    value: z.string().min(1).max(50),
    label: z.string().min(1).max(100),
    urutan: z.number().int(),
    poin: z.number().nullable().optional()
  })).min(1, 'Minimal harus ada 1 opsi penilaian')
})

export const saveRubrik = createServerFn({ method: 'POST' })
  .validator(rubrikSchema)
  .handler(async ({ data }) => {
    const context = await requireAuth()
    requireTenantRole(context.user, ['admin'])
    const { tenantId } = context.user

    try {
      let rubrikId: string

      if (data.id) {
        // Ini adalah operasi UPDATE
        const [existing] = await db
          .select({ id: rubrikPenilaian.id, key: rubrikPenilaian.key })
          .from(rubrikPenilaian)
          .where(and(eq(rubrikPenilaian.tenantId, tenantId), eq(rubrikPenilaian.id, data.id)))
          .limit(1)

        if (!existing) {
          throw new Error('Rubrik tidak ditemukan')
        }

        if (existing.key !== data.key) {
          throw new Error('Key rubrik tidak bisa diubah setelah dibuat')
        }

        rubrikId = existing.id
        // Update label rubrik
        await db.update(rubrikPenilaian)
          .set({ label: data.label })
          .where(eq(rubrikPenilaian.id, rubrikId))
      } else {
        // Ini adalah operasi CREATE (tambah baru)
        // Pastikan key belum dipakai
        const [existingKey] = await db
          .select({ id: rubrikPenilaian.id })
          .from(rubrikPenilaian)
          .where(and(eq(rubrikPenilaian.tenantId, tenantId), eq(rubrikPenilaian.key, data.key)))
          .limit(1)

        if (existingKey) {
          throw new Error('Key rubrik ini sudah digunakan. Silakan gunakan key lain.')
        }

        // Create new rubrik
        const [newRubrik] = await db.insert(rubrikPenilaian)
          .values({
            tenantId,
            key: data.key,
            label: data.label,
            urutan: 1, // default for now, can be expanded later
            aktif: true
          })
          .returning({ id: rubrikPenilaian.id })
        rubrikId = newRubrik.id
      }

      // 2. Hapus opsi lama yang tidak ada di payload (jika aman)
      const incomingIds = data.opsi.map(o => o.id).filter(Boolean) as string[]
      
      const existingOpsi = await db.select({ id: rubrikOpsi.id, value: rubrikOpsi.value })
        .from(rubrikOpsi)
        .where(eq(rubrikOpsi.rubrikId, rubrikId))

      for (const oldOpsi of existingOpsi) {
        if (!incomingIds.includes(oldOpsi.id)) {
          // Cek apakah dipakai di setoran lama
          const result = await db.execute(sql`
            SELECT 1 FROM setoran 
            WHERE tenant_id = ${tenantId} 
            AND penilaian_kustom->>${data.key} = ${oldOpsi.value}
            LIMIT 1
          `)
          const usage = result.rows[0]

          if (usage) {
            throw new Error(`Opsi "${oldOpsi.value}" masih digunakan pada data setoran historis dan tidak dapat dihapus.`)
          } else {
            await db.delete(rubrikOpsi).where(eq(rubrikOpsi.id, oldOpsi.id))
          }
        }
      }

      // 3. Upsert opsi
      for (const op of data.opsi) {
        if (op.id) {
          await db.update(rubrikOpsi)
            .set({ label: op.label, urutan: op.urutan, poin: op.poin ?? null })
            .where(eq(rubrikOpsi.id, op.id))
        } else {
          await db.insert(rubrikOpsi).values({
            rubrikId,
            value: op.value,
            label: op.label,
            urutan: op.urutan,
            poin: op.poin ?? null
          })
        }
      }

      return { success: true }
    } catch (err: any) {
      if (err.message.includes('masih digunakan')) {
        throw err
      }
      console.error('saveRubrik error:', err)
      throw new Error('Gagal menyimpan rubrik')
    }
  })

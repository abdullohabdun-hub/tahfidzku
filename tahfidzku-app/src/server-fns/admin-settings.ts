import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { tenants } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'

export const getTenantInfo = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin', 'ustadz', 'wali', 'santri')

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

export const runDbMigration = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // 0004 Migration
      try {
        await db.execute(sql`ALTER TABLE santri ADD COLUMN IF NOT EXISTS juz_ujian_pending integer`)
      } catch(e) {}

      try { await db.execute(sql`CREATE TYPE status_ujian AS ENUM ('lulus', 'tidak_lulus')`) } catch(e) {}
      try { await db.execute(sql`CREATE TYPE skor_kelancaran AS ENUM ('lancar', 'mengulang', 'terbata')`) } catch(e) {}
      try { await db.execute(sql`CREATE TYPE skor_tajwid AS ENUM ('sempurna', 'cukup', 'kurang')`) } catch(e) {}

      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS ujian (
            id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            santri_id   uuid NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
            ustadz_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            juz         integer NOT NULL,
            kelancaran  skor_kelancaran NOT NULL,
            tajwid      skor_tajwid NOT NULL,
            skor        integer NOT NULL,
            status      status_ujian NOT NULL,
            catatan     text,
            attempt     integer NOT NULL DEFAULT 1,
            created_at  timestamptz NOT NULL DEFAULT now()
          )
        `)
      } catch(e) {}

      // 0005 Migration — Tabel rapor_settings
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS rapor_settings (
            id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
            nama_lembaga    varchar(255),
            alamat_lembaga  text,
            logo_url        varchar(500),
            kota_cetak      varchar(100),
            nama_mudir      varchar(255),
            nip_mudir       varchar(50),
            catatan_footer  text,
            created_at      timestamptz NOT NULL DEFAULT now(),
            updated_at      timestamptz NOT NULL DEFAULT now()
          )
        `)
      } catch(e) {}

      // 0006 Migration — Kolom skor penilaian standar
      try {
        await db.execute(sql`ALTER TABLE setoran ADD COLUMN IF NOT EXISTS skor_kualitas integer`)
      } catch(e) {}
      try {
        await db.execute(sql`ALTER TABLE setoran ADD COLUMN IF NOT EXISTS status_hafalan varchar(20)`)
      } catch(e) {}
      try {
        await db.execute(sql`ALTER TABLE rapor_settings ADD COLUMN IF NOT EXISTS label_penilaian jsonb`)
      } catch(e) {}

      return success(null, 'Migrasi database berhasil dijalankan!')

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
      requireRole(session, 'admin')

      await db
        .update(tenants)
        .set({ namaLembaga: data.namaLembaga })
        .where(eq(tenants.id, session.user.tenantId))

      return success(null, 'Berhasil memperbarui pengaturan lembaga')
    } catch (err) {
      return handleError(err)
    }
  })

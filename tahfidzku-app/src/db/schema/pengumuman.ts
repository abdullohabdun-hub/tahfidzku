import { pgTable, uuid, varchar, text, boolean, timestamp, index, pgEnum } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { kelas } from './kelas'

export const targetAudiensEnum = pgEnum('target_audiens', ['semua', 'kelas', 'tahfidz', 'iqra'])

export const pengumuman = pgTable('pengumuman', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  judul: varchar('judul', { length: 255 }).notNull(),
  konten: text('konten').notNull(),
  targetAudiens: targetAudiensEnum('target_audiens').default('semua').notNull(),
  kelasId: uuid('kelas_id').references(() => kelas.id, { onDelete: 'cascade' }),
  isAktif: boolean('is_aktif').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => {
  return {
    tenantIdIsAktifIdx: index('idx_pengumuman_tenant_aktif').on(t.tenantId, t.isAktif),
  }
})

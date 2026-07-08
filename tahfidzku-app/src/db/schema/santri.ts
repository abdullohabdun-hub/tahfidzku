// src/db/schema/santri.ts
// Tabel santri — data peserta didik, terkait tenant dan kelas

import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const santri = pgTable('santri', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  nama: varchar('nama', { length: 255 }).notNull(),
  kelasId: uuid('kelas_id'),  // FK ke tabel kelas (akan di-reference setelah kelas dibuat)
  targetJuz: integer('target_juz').notNull().default(30),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

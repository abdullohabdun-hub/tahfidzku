// src/db/schema/ujian.ts
// Tabel ujian — catatan hasil Ujian Kenaikan Juz

import { pgTable, uuid, integer, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { santri } from './santri'
import { users } from './users'

export const statusUjianEnum = pgEnum('status_ujian', ['lulus', 'tidak_lulus'])
export const skorKelancaranEnum = pgEnum('skor_kelancaran', ['lancar', 'mengulang', 'terbata'])
export const skorTajwidEnum = pgEnum('skor_tajwid', ['sempurna', 'cukup', 'kurang'])

export const ujian = pgTable('ujian', {
  id:         uuid('id').defaultRandom().primaryKey(),
  tenantId:   uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  santriId:   uuid('santri_id')
    .notNull()
    .references(() => santri.id, { onDelete: 'cascade' }),
  ustadzId:   uuid('ustadz_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  juz:        integer('juz').notNull(),               // Juz yang diujikan (misal: 29)
  kelancaran: skorKelancaranEnum('kelancaran').notNull(), // Rubrik kelancaran
  tajwid:     skorTajwidEnum('tajwid').notNull(),      // Rubrik tajwid
  skor:       integer('skor').notNull(),               // Skor referensi 0-100 (bukan penentu lulus)
  status:     statusUjianEnum('status').notNull(),     // Keputusan final ustadz: lulus/tidak_lulus
  catatan:    text('catatan'),                         // Catatan opsional ustadz
  cakupanMateri: text('cakupan_materi'),                   // Opsional: cakupan materi ujian (misal: An-Naba 1-20)
  attempt:    integer('attempt').notNull().default(1), // Percobaan ke berapa untuk juz ini

  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxUjianTenantSantri: index('idx_ujian_tenant_santri').on(table.tenantId, table.santriId),
  idxUjianTenantJuz: index('idx_ujian_tenant_juz').on(table.tenantId, table.juz),
}))

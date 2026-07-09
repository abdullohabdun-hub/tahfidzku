// src/db/schema/santri.ts
// Tabel santri — data peserta didik, terkait tenant dan kelas

import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { kelas } from './kelas'

export const tipeSantriEnum = pgEnum('tipe_santri', ['reguler', 'dewasa'])

export const santri = pgTable('santri', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  nama: varchar('nama', { length: 255 }).notNull(),
  tipe: tipeSantriEnum('tipe').notNull().default('dewasa'),
  kelasId: uuid('kelas_id').references(() => kelas.id, { onDelete: 'set null' }),
  targetJuz: integer('target_juz').notNull().default(30),
  juzProgress: integer('juz_progress').array().default([]), // Juz yang sudah diselesaikan (contoh: [30, 29])
  hafalanAwal: integer('hafalan_awal').default(0), // Jumlah juz hafalan sebelum masuk sistem
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

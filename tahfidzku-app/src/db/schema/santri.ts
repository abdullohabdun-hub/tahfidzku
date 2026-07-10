// src/db/schema/santri.ts
// Tabel santri — data peserta didik, terkait tenant dan kelas

import { pgTable, uuid, varchar, integer, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core'
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
  batasHafalanJuz: integer('batas_hafalan_juz'), // Opsional: Juz untuk hafalan parsial
  batasHafalanSurah: varchar('batas_hafalan_surah', { length: 100 }), // Opsional: Surah untuk hafalan parsial
  batasHafalanAyat: integer('batas_hafalan_ayat'), // Opsional: Ayat terakhir untuk hafalan parsial
  posisiTerakhir: jsonb('posisi_terakhir').$type<{surahNomor: number, ayat: number}>(), // Tracker untuk prefill setoran Ziyadah otomatis
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

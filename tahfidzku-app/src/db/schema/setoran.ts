// src/db/schema/setoran.ts
// Tabel setoran — catatan hafalan yang diinput oleh Ustadz

import { pgTable, uuid, varchar, integer, text, timestamp, pgEnum, real, boolean, jsonb } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { santri } from './santri'
import { users } from './users'

export const jenisSetoranEnum = pgEnum('jenis_setoran', ['ziyadah', 'sabqi', 'manzil'])
export const kualitasEnum = pgEnum('kualitas_bacaan', ['lancar', 'mengulang', 'terbata'])

export const setoran = pgTable('setoran', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  santriId: uuid('santri_id')
    .notNull()
    .references(() => santri.id, { onDelete: 'cascade' }),
  ustadzId: uuid('ustadz_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  jenis: jenisSetoranEnum('jenis').notNull(),
  juz: integer('juz'),
  juzMulai: integer('juz_mulai'),
  juzSelesai: integer('juz_selesai'),
  lintasJuz: boolean('lintas_juz').default(false),
  halamanAwal: real('halaman_awal'),
  halamanAkhir: real('halaman_akhir'),
  surah: varchar('surah', { length: 100 }),
  ayatAwal: integer('ayat_awal'),
  ayatAkhir: integer('ayat_akhir'),
  surahMeta: jsonb('surah_meta').$type<Record<string, any>>(),
  kualitas: kualitasEnum('kualitas').notNull(),
  catatan: text('catatan'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

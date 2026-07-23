// src/db/schema/setoran.ts
// Tabel setoran — catatan hafalan yang diinput oleh Ustadz

import { pgTable, uuid, varchar, integer, text, timestamp, pgEnum, real, boolean, jsonb } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { santri } from './santri'
import { users } from './users'
import { uniqueIndex } from 'drizzle-orm/pg-core'

export const jenisSetoranEnum = pgEnum('jenis_setoran', ['ziyadah', 'sabqi', 'manzil'])
export const kualitasEnum = pgEnum('kualitas_bacaan', ['lancar', 'mengulang', 'terbata'])
export const sumberSetoranEnum = pgEnum('sumber_setoran', ['ustadz', 'santri_self_report'])

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
  kualitas: kualitasEnum('kualitas'), // DEPRECATED — dipertahankan untuk backward compat data lama
  skorKualitas: integer('skor_kualitas'),  // 1-5: 5=Mumtaz, 4=JayyidJiddan, 3=Jayyid, 2=Daif, 1=DaifJiddan
  statusHafalan: varchar('status_hafalan', { length: 20 }), // 'lanjut' | 'mengulang'
  penilaianKustom: jsonb('penilaian_kustom').$type<Record<string, any>>(),
  catatan: text('catatan'),
  sumber: sumberSetoranEnum('sumber').notNull().default('ustadz'),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  previousData: jsonb('previous_data').$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const rubrikPenilaian = pgTable('rubrik_penilaian', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 50 }).notNull(), // 'kualitas', slug identifier stabil
  label: varchar('label', { length: 100 }).notNull(), // "Kualitas Hafalan" (bisa diganti admin)
  urutan: integer('urutan').notNull().default(0),
  aktif: boolean('aktif').notNull().default(true),
}, (table) => {
  return {
    uniqKeyPerTenant: uniqueIndex('uniq_rubrik_key_tenant').on(table.tenantId, table.key),
  }
})

export const rubrikOpsi = pgTable('rubrik_opsi', {
  id: uuid('id').defaultRandom().primaryKey(),
  rubrikId: uuid('rubrik_id').notNull().references(() => rubrikPenilaian.id, { onDelete: 'cascade' }),
  value: varchar('value', { length: 50 }).notNull(), // stabil, dipakai sebagai kunci simpan
  label: varchar('label', { length: 100 }).notNull(), // teks yang admin bisa ganti
  poin: integer('poin'), // opsional, untuk lembaga yang mau skor numerik
  urutan: integer('urutan').notNull().default(0),
})

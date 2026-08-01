// src/db/schema/santri.ts
// Tabel santri — data peserta didik, terkait tenant dan kelas

import { pgTable, uuid, varchar, integer, timestamp, pgEnum, jsonb, date, text } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { tenants } from './tenants'
import { kelas, hariEnum } from './kelas'
import { users } from './users'

export const tipeSantriEnum = pgEnum('tipe_santri', ['reguler', 'dewasa'])
export const tahapSantriEnum = pgEnum('tahap_santri', ['iqra', 'tahfidz'])

export const santri = pgTable('santri', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  nama: varchar('nama', { length: 255 }).notNull(),
  // santri.tipe, JANGAN disamakan dengan kelas.tipeKelas (di sini reguler = tipe santri, dewasa = dewasa)
  tipe: tipeSantriEnum('tipe').notNull().default('dewasa'),
  tahapSantri: tahapSantriEnum('tahap_santri').notNull().default('tahfidz'),
  jilidIqraTerakhir: integer('jilid_iqra_terakhir'),
  halamanIqraTerakhir: integer('halaman_iqra_terakhir'),
  tahapSantriUpdatedBy: uuid('tahap_santri_updated_by').references(() => users.id),
  tahapSantriUpdatedAt: timestamp('tahap_santri_updated_at', { withTimezone: true }),
  posisiTerakhirUpdatedBy: uuid('posisi_terakhir_updated_by').references(() => users.id),
  posisiTerakhirUpdatedAt: timestamp('posisi_terakhir_updated_at', { withTimezone: true }),
  posisiTerakhirUpdateNote: text('posisi_terakhir_update_note'),
  kelasId: uuid('kelas_id').references(() => kelas.id, { onDelete: 'set null' }),
  targetJuz: integer('target_juz').notNull().default(30),
  juzProgress: integer('juz_progress').array().default([]), // Juz yang sudah diselesaikan (contoh: [30, 29])
  batasHafalanJuz: integer('batas_hafalan_juz'), // Opsional: Juz untuk hafalan parsial
  batasHafalanSurah: varchar('batas_hafalan_surah', { length: 100 }), // Opsional: Surah untuk hafalan parsial
  batasHafalanAyat: integer('batas_hafalan_ayat'), // Opsional: Ayat terakhir untuk hafalan parsial
  urutanHafalan: integer('urutan_hafalan').array().default([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]).notNull(), // Urutan hafalan santri
  posisiTerakhir: jsonb('posisi_terakhir').$type<{surahNomor: number, ayat: number}>(), // Tracker untuk prefill setoran Ziyadah otomatis
  juzUjianPending: integer('juz_ujian_pending'), // Juz yang sedang menunggu ujian kenaikan (null = tidak ada)
  targetTanggalSelesai: date('target_tanggal_selesai'), // nullable
  hariMasuk: hariEnum('hari_masuk').array().notNull().default(sql`'{}'::hari[]`),
  /** 
   * PERHATIAN: Default kosong = santri tidak punya jadwal masuk.
   * Di UI, saat create santri baru, HARUS explicit pilih minimal hari
   * sesuai kelasnya (atau backend auto-fill dari kelas.hariPertemuan).
   */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

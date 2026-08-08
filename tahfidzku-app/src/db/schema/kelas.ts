import { pgTable, uuid, varchar, timestamp, pgEnum, time, jsonb, integer } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { tenants } from './tenants'
import { users } from './users'

export const hariEnum = pgEnum('hari', [
  'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'
])

export const tipeKelasEnum = pgEnum('tipe_kelas', ['reguler', 'online', 'reguler_non_mukim'])

export const kelas = pgTable('kelas', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  nama: varchar('nama', { length: 255 }).notNull(),
  ustadzId: uuid('ustadz_id').references(() => users.id, { onDelete: 'set null' }), // Penanggung jawab halaqoh
  // kelas.tipeKelas, JANGAN disamakan dengan santri.tipe (di sini reguler = mukim, online = non-mukim)
  tipeKelas: tipeKelasEnum('tipe_kelas'),
  waktuShalatDiizinkan: jsonb('waktu_shalat_diizinkan').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  hariPertemuan: hariEnum('hari_pertemuan').array().notNull().default(sql`'{}'::hari[]`),
  jamMulai: time('jam_mulai'),
  jamSelesai: time('jam_selesai'),
  targetHariSetoranBulanan: integer('target_hari_setoran_bulanan'),
  targetSelfReportBulanan: integer('target_self_report_bulanan'), // nullable, no default — admin wajib isi manual
})

import { pgTable, uuid, timestamp, date, uniqueIndex, pgEnum, text, jsonb, integer } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { kelas } from './kelas'
import { santri } from './santri'
import { users } from './users'

export const statusAbsensiEnum = pgEnum('status_absensi', [
  'hadir', 'izin', 'sakit', 'alpa', 'terlambat', 'hadir_tanpa_setoran'
])

export const waktuSesiEnum = pgEnum('waktu_sesi', [
  'subuh', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya'
])

export const sesiKelas = pgTable('sesi_kelas', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  kelasId: uuid('kelas_id').notNull().references(() => kelas.id, { onDelete: 'cascade' }),
  tanggal: date('tanggal').notNull(),
  waktuSesi: waktuSesiEnum('waktu_sesi').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqSesi: uniqueIndex('uniq_sesi_kelas_tanggal_waktu').on(table.kelasId, table.tanggal, table.waktuSesi),
}))

export const absensi = pgTable('absensi', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  sesiKelasId: uuid('sesi_kelas_id').notNull().references(() => sesiKelas.id, { onDelete: 'cascade' }),
  santriId: uuid('santri_id').notNull().references(() => santri.id, { onDelete: 'cascade' }),
  status: statusAbsensiEnum('status').notNull(),
  catatan: text('catatan'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  previousData: jsonb('previous_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => ({
  uniqAbsensi: uniqueIndex('uniq_absensi_santri_sesi').on(table.santriId, table.sesiKelasId),
}))

export const rekapMingguanSantri = pgTable('rekap_mingguan_santri', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  santriId: uuid('santri_id').notNull().references(() => santri.id),
  mingguMulai: date('minggu_mulai').notNull(),
  totalHadir: integer('total_hadir').notNull().default(0),
  totalIzin: integer('total_izin').notNull().default(0),
  totalSakit: integer('total_sakit').notNull().default(0),
  totalAlpa: integer('total_alpa').notNull().default(0),
  totalTerlambat: integer('total_terlambat').notNull().default(0),
  totalHadirTanpaSetoran: integer('total_hadir_tanpa_setoran').notNull().default(0),
  totalHadirDenganSetoran: integer('total_hadir_dengan_setoran').notNull().default(0),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueRekap: uniqueIndex('uniq_rekap_mingguan').on(table.santriId, table.mingguMulai),
}))

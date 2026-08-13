import { pgTable, uuid, integer, varchar, text, timestamp, pgEnum, date, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { santri } from './santri'
import { users } from './users'
import { sesiKelas } from './absensi'

export const setoranIqra = pgTable('setoran_iqra', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  santriId: uuid('santri_id').notNull().references(() => santri.id, { onDelete: 'cascade' }),
  sesiKelasId: uuid('sesi_kelas_id').references(() => sesiKelas.id), // nullable, sama seperti setoran tahfidz
  tanggalSetoran: date('tanggal_setoran').notNull(),
  jilid: integer('jilid').notNull(), // 1-6
  halamanAwal: integer('halaman_awal').notNull(),
  halamanAkhir: integer('halaman_akhir').notNull(),
  skorKualitas: integer('skor_kualitas'), // 1-5, konsisten dengan tahfidz
  statusHafalan: varchar('status_hafalan', { length: 20 }), // 'lanjut' | 'mengulang', konsisten dengan setoran tahfidz
  catatan: text('catatan'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxSetoranIqraTenantTanggal: index('idx_setoran_iqra_tenant_tanggal').on(table.tenantId, table.tanggalSetoran),
}));

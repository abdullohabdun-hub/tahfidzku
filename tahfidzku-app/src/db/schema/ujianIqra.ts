import { pgTable, uuid, integer, boolean, text, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { santri } from './santri'
import { users } from './users'

export const ujianIqra = pgTable('ujian_iqra', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  santriId: uuid('santri_id').notNull().references(() => santri.id, { onDelete: 'cascade' }),
  jilidDiuji: integer('jilid_diuji').notNull(), // jilid yang sedang diuji untuk naik (1-6; kalau lulus jilid 6 -> transisi ke tahfidz)
  skor: integer('skor'),
  lulus: boolean('lulus').notNull(),
  catatan: text('catatan'),
  ujiOlehUstadzId: uuid('uji_oleh_ustadz_id').notNull().references(() => users.id),
  tanggalUjian: timestamp('tanggal_ujian', { withTimezone: true }).defaultNow().notNull(),
  attempt: integer('attempt').notNull().default(1), // Percobaan ke berapa untuk jilid ini
}, (table) => ({
  idxUjianIqraTenantSantri: index('idx_ujian_iqra_tenant_santri').on(table.tenantId, table.santriId),
  idxUjianIqraTenantJilid: index('idx_ujian_iqra_tenant_jilid').on(table.tenantId, table.jilidDiuji),
}));

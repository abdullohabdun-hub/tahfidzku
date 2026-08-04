import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'
import { santri } from './santri'
import { setoran } from './setoran'

export const notifikasiUstadz = pgTable('notifikasi_ustadz', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  ustadzId: uuid('ustadz_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  setoranId: uuid('setoran_id')
    .references(() => setoran.id, { onDelete: 'cascade' }),
  tipe: varchar('tipe', { length: 50 }).notNull(),
  pesan: text('pesan').notNull(),
  dibacaPada: timestamp('dibaca_pada', { withTimezone: true }),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).defaultNow().notNull(),
})

export const notifikasiSantri = pgTable('notifikasi_santri', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  santriId: uuid('santri_id')
    .notNull()
    .references(() => santri.id, { onDelete: 'cascade' }),
  setoranId: uuid('setoran_id')
    .references(() => setoran.id, { onDelete: 'cascade' }),
  tipe: varchar('tipe', { length: 50 }).notNull(),
  pesan: text('pesan').notNull(),
  dibacaPada: timestamp('dibaca_pada', { withTimezone: true }),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    santriIndex: index('idx_notifikasi_santri_tenant_santri_dibaca').on(table.tenantId, table.santriId, table.dibacaPada),
  }
})

export const notifikasiGagalLog = pgTable('notifikasi_gagal_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  konteks: varchar('konteks', { length: 100 }).notNull(),
  referensiId: uuid('referensi_id'),
  errorMessage: text('error_message'),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).defaultNow().notNull(),
})

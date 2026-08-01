import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'
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

import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'
import { santri } from './santri'

export const waliSantri = pgTable('wali_santri', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  waliUserId: uuid('wali_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  santriId: uuid('santri_id')
    .notNull()
    .references(() => santri.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqWaliSantri: unique().on(t.waliUserId, t.santriId),
}))

import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users, roleEnum } from './users'

export const tiketStatusEnum = pgEnum('tiket_status', ['baru', 'diproses', 'selesai'])
export const tiketKategoriEnum = pgEnum('tiket_kategori', ['bug', 'fitur', 'pertanyaan', 'lainnya'])

export const tiket = pgTable('tiket', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  submitterId: uuid('submitter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  submitterRole: roleEnum('submitter_role').notNull(),
  kategori: tiketKategoriEnum('kategori').notNull(),
  subject: varchar('subject', { length: 150 }).notNull(),
  message: varchar('message', { length: 2000 }).notNull(),
  status: tiketStatusEnum('status').default('baru').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Karena superadmin tidak ada di roleEnum users, kita buat enum khusus untuk balasan
export const authorRoleEnum = pgEnum('author_role', ['admin', 'ustadz', 'santri', 'wali', 'superadmin'])

export const tiketBalasan = pgTable('tiket_balasan', {
  id: uuid('id').defaultRandom().primaryKey(),
  tiketId: uuid('tiket_id')
    .notNull()
    .references(() => tiket.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  authorRole: authorRoleEnum('author_role').notNull(),
  pesan: text('pesan').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

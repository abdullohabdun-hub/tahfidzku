// src/db/schema/users.ts
// Tabel users — mencakup semua role (admin, ustadz, santri, wali)

import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const roleEnum = pgEnum('user_role', ['admin', 'ustadz', 'santri', 'wali'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  nama: varchar('nama', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull(),
  // Untuk role 'santri' dan 'wali', merujuk ke data santri terkait
  santriId: uuid('santri_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

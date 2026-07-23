// src/db/schema/users.ts
// Tabel users — mencakup semua role (admin, ustadz, santri, wali)

import { pgTable, uuid, varchar, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const roleEnum = pgEnum('user_role', ['admin', 'ustadz', 'santri', 'wali'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  nama: varchar('nama', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).unique(),
  noWa: varchar('no_wa', { length: 50 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull(),
  // Untuk role 'santri' dan 'wali', merujuk ke data santri terkait
  santriId: uuid('santri_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
  failedPasswordAttempts: integer('failed_password_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
})

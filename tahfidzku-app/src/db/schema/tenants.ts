// src/db/schema/tenants.ts
// Tabel utama untuk multi-tenancy — setiap lembaga tahfidz = 1 tenant

import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  namaLembaga: varchar('nama_lembaga', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

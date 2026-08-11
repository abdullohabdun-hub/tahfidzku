// src/db/schema/tenants.ts
// Tabel utama untuk multi-tenancy — setiap lembaga tahfidz = 1 tenant

import { pgTable, uuid, varchar, timestamp, pgEnum, text, boolean, integer } from 'drizzle-orm/pg-core'

export const statusEnum = pgEnum('tenant_status', ['pending', 'trial', 'aktif', 'suspend', 'rejected'])
export const customDomainStatusEnum = pgEnum('custom_domain_status', ['none', 'pending', 'active', 'failed'])

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  namaLembaga: varchar('nama_lembaga', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  status: statusEnum('status').notNull().default('pending'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  email: varchar('email', { length: 255 }),
  noWa: varchar('no_wa', { length: 50 }),
  catatan: text('catatan'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  trialWarningSent: boolean('trial_warning_sent').default(false).notNull(),
  minHariMasukSantri: integer('min_hari_masuk_santri').notNull().default(2),
  themeColor: varchar('theme_color', { length: 20 }).default('#047857').notNull(),
  themePreset: varchar('theme_preset', { length: 50 }),
  logoUrl: text('logo_url'),
  themeConfigured: boolean('theme_configured').default(false).notNull(),
  customDomain: varchar('custom_domain', { length: 255 }).unique(),
  customDomainStatus: customDomainStatusEnum('custom_domain_status').notNull().default('none'),
  customDomainVerifiedAt: timestamp('custom_domain_verified_at', { withTimezone: true }),
})

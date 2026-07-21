// src/db/schema/billing-logs.ts
// Tabel log perubahan billing/status tenant oleh Super Admin
import { pgTable, uuid, timestamp, pgEnum, text } from 'drizzle-orm/pg-core'
import { tenants, statusEnum } from './tenants'
export const billingActionEnum = pgEnum('billing_action', ['aktifkan', 'suspend', 'perpanjang_trial', 'ubah_catatan', 'approve', 'reject'])
export const billingLogs = pgTable('billing_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  action: billingActionEnum('action').notNull(),
  statusBefore: statusEnum('status_before'),
  statusAfter: statusEnum('status_after'),
  catatan: text('catatan'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

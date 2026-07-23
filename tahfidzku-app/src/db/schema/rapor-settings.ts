// src/db/schema/rapor-settings.ts
// Tabel pengaturan template rapor per lembaga (one-to-one dengan tenants)

import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const raporSettings = pgTable('rapor_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  // Identitas lembaga untuk kop surat
  namaLembaga:    varchar('nama_lembaga', { length: 255 }),
  alamatLembaga:  text('alamat_lembaga'),
  logoUrl:        varchar('logo_url', { length: 500 }),

  // Data penandatangan rapor
  kotaCetak:      varchar('kota_cetak', { length: 100 }),  // contoh: "Bandung"
  namaMudir:      varchar('nama_mudir', { length: 255 }),  // Kepala/Mudir
  nipMudir:       varchar('nip_mudir', { length: 50 }),

  // Catatan footer/penutup rapor
  catatanFooter:  text('catatan_footer'),

  // Label kustom per lembaga untuk skor 1-5 (opsional, fallback ke default jika null)
  // Contoh: { skor5: 'Mumtaz', skor4: 'Jayyid Jiddan', skor3: 'Jayyid', skor2: "Da'if", skor1: "Da'if Jiddan" }
  labelPenilaian: jsonb('label_penilaian').$type<Record<string, string>>(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

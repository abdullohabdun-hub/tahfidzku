import { relations } from 'drizzle-orm'
import { tenants } from './tenants'
import { users } from './users'
import { kelas } from './kelas'
import { santri } from './santri'
import { setoran, rubrikPenilaian, rubrikOpsi } from './setoran'
import { ujian } from './ujian'
import { setoranIqra } from './setoranIqra'
import { ujianIqra } from './ujianIqra'
import { impersonationLogs } from './impersonation'
import { billingLogs } from './billing-logs'
import { absensi, sesiKelas } from './absensi'
import { waliSantri } from './wali-santri'
import { raporSettings } from './rapor-settings'
import { tiket, tiketBalasan } from './tiket'
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  users: many(users),
  kelas: many(kelas),
  santri: many(santri),
  setoran: many(setoran),
  ujian: many(ujian),
  setoranIqra: many(setoranIqra),
  ujianIqra: many(ujianIqra),
  impersonationLogs: many(impersonationLogs),
  billingLogs: many(billingLogs),
  raporSettings: one(raporSettings, {
    fields: [tenants.id],
    references: [raporSettings.tenantId],
  }),
  tiket: many(tiket),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  kelasDiampu: many(kelas), // Sebagai Ustadz
  setoranDiterima: many(setoran), // Sebagai Ustadz
  setoranIqraDiterima: many(setoranIqra), // Sebagai Ustadz
  ujianIqraDiterima: many(ujianIqra), // Sebagai Ustadz
  santriTerkait: one(santri, { // Untuk role wali/santri
    fields: [users.santriId],
    references: [santri.id],
  }),
  daftarAnak: many(waliSantri), // Untuk role wali (many-to-many)
  tiketDikirim: many(tiket),
  tiketBalasan: many(tiketBalasan),
}))

export const kelasRelations = relations(kelas, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [kelas.tenantId],
    references: [tenants.id],
  }),
  ustadz: one(users, {
    fields: [kelas.ustadzId],
    references: [users.id],
  }),
  santri: many(santri),
}))

export const santriRelations = relations(santri, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [santri.tenantId],
    references: [tenants.id],
  }),
  kelas: one(kelas, {
    fields: [santri.kelasId],
    references: [kelas.id],
  }),
  setoran: many(setoran),
  ujian: many(ujian),
  setoranIqra: many(setoranIqra),
  ujianIqra: many(ujianIqra),
  akun: many(users), // Akun wali / santri yang terhubung ke santri ini
  daftarWali: many(waliSantri), // Relasi ke wali (many-to-many)
}))

export const setoranRelations = relations(setoran, ({ one }) => ({
  tenant: one(tenants, {
    fields: [setoran.tenantId],
    references: [tenants.id],
  }),
  santri: one(santri, {
    fields: [setoran.santriId],
    references: [santri.id],
  }),
  ustadz: one(users, {
    fields: [setoran.ustadzId],
    references: [users.id],
  }),
}))

export const ujianRelations = relations(ujian, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ujian.tenantId],
    references: [tenants.id],
  }),
  santri: one(santri, {
    fields: [ujian.santriId],
    references: [santri.id],
  }),
  ustadz: one(users, {
    fields: [ujian.ustadzId],
    references: [users.id],
  }),
}))

export const impersonationLogsRelations = relations(impersonationLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [impersonationLogs.tenantId],
    references: [tenants.id],
  }),
  admin: one(users, {
    fields: [impersonationLogs.adminId],
    references: [users.id],
  }),
}))

export const billingLogsRelations = relations(billingLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [billingLogs.tenantId],
    references: [tenants.id],
  }),
}))

export const rubrikPenilaianRelations = relations(rubrikPenilaian, ({ many }) => ({
  opsi: many(rubrikOpsi),
}))

export const rubrikOpsiRelations = relations(rubrikOpsi, ({ one }) => ({
  rubrik: one(rubrikPenilaian, {
    fields: [rubrikOpsi.rubrikId],
    references: [rubrikPenilaian.id],
  }),
}))

export const sesiKelasRelations = relations(sesiKelas, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sesiKelas.tenantId],
    references: [tenants.id],
  }),
  kelas: one(kelas, {
    fields: [sesiKelas.kelasId],
    references: [kelas.id],
  }),
  createdBy: one(users, {
    fields: [sesiKelas.createdBy],
    references: [users.id],
  }),
  absensi: many(absensi),
  setoranIqra: many(setoranIqra),
}))

export const absensiRelations = relations(absensi, ({ one }) => ({
  tenant: one(tenants, {
    fields: [absensi.tenantId],
    references: [tenants.id],
  }),
  sesiKelas: one(sesiKelas, {
    fields: [absensi.sesiKelasId],
    references: [sesiKelas.id],
  }),
  santri: one(santri, {
    fields: [absensi.santriId],
    references: [santri.id],
  }),
  createdBy: one(users, {
    fields: [absensi.createdBy],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [absensi.updatedBy],
    references: [users.id],
  }),
}))

export const waliSantriRelations = relations(waliSantri, ({ one }) => ({
  tenant: one(tenants, {
    fields: [waliSantri.tenantId],
    references: [tenants.id],
  }),
  wali: one(users, {
    fields: [waliSantri.waliUserId],
    references: [users.id],
  }),
  santri: one(santri, {
    fields: [waliSantri.santriId],
    references: [santri.id],
  }),
}))

export const raporSettingsRelations = relations(raporSettings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [raporSettings.tenantId],
    references: [tenants.id],
  }),
}))

export const setoranIqraRelations = relations(setoranIqra, ({ one }) => ({
  tenant: one(tenants, {
    fields: [setoranIqra.tenantId],
    references: [tenants.id],
  }),
  santri: one(santri, {
    fields: [setoranIqra.santriId],
    references: [santri.id],
  }),
  sesiKelas: one(sesiKelas, {
    fields: [setoranIqra.sesiKelasId],
    references: [sesiKelas.id],
  }),
  createdBy: one(users, {
    fields: [setoranIqra.createdBy],
    references: [users.id],
  }),
}))

export const ujianIqraRelations = relations(ujianIqra, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ujianIqra.tenantId],
    references: [tenants.id],
  }),
  santri: one(santri, {
    fields: [ujianIqra.santriId],
    references: [santri.id],
  }),
  ujiOlehUstadz: one(users, {
    fields: [ujianIqra.ujiOlehUstadzId],
    references: [users.id],
  }),
}))

export const tiketRelations = relations(tiket, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tiket.tenantId],
    references: [tenants.id],
  }),
  submitter: one(users, {
    fields: [tiket.submitterId],
    references: [users.id],
  }),
  balasan: many(tiketBalasan),
}))

export const tiketBalasanRelations = relations(tiketBalasan, ({ one }) => ({
  tiket: one(tiket, {
    fields: [tiketBalasan.tiketId],
    references: [tiket.id],
  }),
  author: one(users, {
    fields: [tiketBalasan.authorId],
    references: [users.id],
  }),
}))

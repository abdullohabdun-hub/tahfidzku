// src/db/schema/index.ts
// Barrel export — satu pintu masuk untuk semua skema database

export { tenants, statusEnum as tenantStatusEnum } from './tenants'
export { users, roleEnum } from './users'
export { santri, tipeSantriEnum, tahapSantriEnum } from './santri'
export { setoran, jenisSetoranEnum, kualitasEnum, sumberSetoranEnum, rubrikPenilaian, rubrikOpsi } from './setoran'
export { setoranIqra } from './setoranIqra'
export { ujianIqra } from './ujianIqra'
export { ujian, statusUjianEnum, skorKelancaranEnum, skorTajwidEnum } from './ujian'
export { kelas, hariEnum, tipeKelasEnum } from './kelas'
export { impersonationLogs, impersonationTargetRoleEnum } from './impersonation'
export { billingLogs, billingActionEnum } from './billing-logs'
export { sesiKelas, absensi, statusAbsensiEnum, rekapMingguanSantri } from './absensi'
export { waliSantri } from './wali-santri'
export { raporSettings } from './rapor-settings'
export * from './relations'

// src/db/schema/index.ts
// Barrel export — satu pintu masuk untuk semua skema database

export { tenants } from './tenants'
export { users, roleEnum } from './users'
export { santri, tipeSantriEnum } from './santri'
export { setoran, jenisSetoranEnum, kualitasEnum, rubrikPenilaian, rubrikOpsi } from './setoran'
export { ujian, statusUjianEnum, skorKelancaranEnum, skorTajwidEnum } from './ujian'
export { kelas, hariEnum } from './kelas'
export { impersonationLogs, impersonationTargetRoleEnum } from './impersonation'
export { billingLogs } from './billing-logs'
export { sesiKelas, absensi, statusAbsensiEnum } from './absensi'
export { waliSantri } from './wali-santri'
export * from './relations'

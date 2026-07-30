CREATE TYPE "public"."tipe_kelas" AS ENUM('reguler', 'online');--> statement-breakpoint
DROP INDEX "uniq_sesi_kelas_tanggal_waktu";--> statement-breakpoint
ALTER TABLE "sesi_kelas" ALTER COLUMN "waktu_sesi" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kelas" ADD COLUMN "tipe_kelas" "tipe_kelas";--> statement-breakpoint
ALTER TABLE "kelas" ADD COLUMN "waktu_shalat_diizinkan" jsonb;--> statement-breakpoint

CREATE UNIQUE INDEX "unique_sesi_reguler"
  ON "sesi_kelas" ("kelas_id", "tanggal", "waktu_sesi")
  WHERE "waktu_sesi" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_sesi_online"
  ON "sesi_kelas" ("kelas_id", "tanggal")
  WHERE "waktu_sesi" IS NULL;--> statement-breakpoint
UPDATE "kelas"
SET "tipe_kelas" = 'online'
WHERE "hari_pertemuan" != '{}'::hari[] OR "jam_mulai" IS NOT NULL;
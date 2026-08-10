ALTER TABLE "kelas" ADD COLUMN IF NOT EXISTS "target_hari_setoran_bulanan" integer;--> statement-breakpoint
ALTER TABLE "kelas" ADD COLUMN IF NOT EXISTS "target_self_report_bulanan" integer;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN IF NOT EXISTS "skor_kualitas_bacaan" integer;

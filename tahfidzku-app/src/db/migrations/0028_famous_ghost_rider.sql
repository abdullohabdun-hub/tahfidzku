ALTER TABLE "kelas" ADD COLUMN "target_hari_setoran_bulanan" integer;--> statement-breakpoint
ALTER TABLE "kelas" ADD COLUMN "target_self_report_bulanan" integer DEFAULT 8 NOT NULL;
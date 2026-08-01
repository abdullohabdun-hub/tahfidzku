ALTER TABLE "santri" ADD COLUMN "hari_masuk" "hari"[] DEFAULT '{}'::hari[] NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "min_hari_masuk_santri" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "ujian" ADD COLUMN "cakupan_materi" text;
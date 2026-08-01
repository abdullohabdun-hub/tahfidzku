ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "hari_masuk" "hari"[] DEFAULT '{}'::hari[] NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "min_hari_masuk_santri" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "ujian" ADD COLUMN IF NOT EXISTS "cakupan_materi" text;
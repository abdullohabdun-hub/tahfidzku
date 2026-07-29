ALTER TABLE "setoran" ADD COLUMN "tanggal_setoran" DATE;--> statement-breakpoint
UPDATE "setoran" SET "tanggal_setoran" = ("created_at" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date WHERE "tanggal_setoran" IS NULL;--> statement-breakpoint
ALTER TABLE "setoran" ALTER COLUMN "tanggal_setoran" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "is_backdated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_setoran_tanggal_setoran" ON "setoran"("tanggal_setoran", "tenant_id");
CREATE TABLE "pengumuman" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"judul" varchar(255) NOT NULL,
	"konten" text NOT NULL,
	"is_aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pengumuman_tenant_aktif" ON "pengumuman" USING btree ("tenant_id","is_aktif");
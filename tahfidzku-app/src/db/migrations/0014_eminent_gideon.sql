CREATE TABLE "rekap_mingguan_santri" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"santri_id" uuid NOT NULL,
	"minggu_mulai" date NOT NULL,
	"total_hadir" integer DEFAULT 0 NOT NULL,
	"total_izin" integer DEFAULT 0 NOT NULL,
	"total_sakit" integer DEFAULT 0 NOT NULL,
	"total_alpa" integer DEFAULT 0 NOT NULL,
	"total_terlambat" integer DEFAULT 0 NOT NULL,
	"total_hadir_tanpa_setoran" integer DEFAULT 0 NOT NULL,
	"total_hadir_dengan_setoran" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rekap_mingguan_santri" ADD CONSTRAINT "rekap_mingguan_santri_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rekap_mingguan_santri" ADD CONSTRAINT "rekap_mingguan_santri_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_rekap_mingguan" ON "rekap_mingguan_santri" USING btree ("santri_id","minggu_mulai");
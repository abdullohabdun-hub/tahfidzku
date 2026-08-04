CREATE TABLE "notifikasi_santri" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"santri_id" uuid NOT NULL,
	"setoran_id" uuid,
	"tipe" varchar(50) NOT NULL,
	"pesan" text NOT NULL,
	"dibaca_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifikasi_santri" ADD CONSTRAINT "notifikasi_santri_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi_santri" ADD CONSTRAINT "notifikasi_santri_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi_santri" ADD CONSTRAINT "notifikasi_santri_setoran_id_setoran_id_fk" FOREIGN KEY ("setoran_id") REFERENCES "public"."setoran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notifikasi_santri_tenant_santri_dibaca" ON "notifikasi_santri" USING btree ("tenant_id","santri_id","dibaca_pada");
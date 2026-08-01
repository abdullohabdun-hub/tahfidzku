CREATE TABLE "notifikasi_ustadz" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ustadz_id" uuid NOT NULL,
	"setoran_id" uuid,
	"tipe" varchar(50) NOT NULL,
	"pesan" text NOT NULL,
	"dibaca_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "ditinjau_oleh_ustadz" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "respon_ustadz" jsonb;--> statement-breakpoint
ALTER TABLE "notifikasi_ustadz" ADD CONSTRAINT "notifikasi_ustadz_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi_ustadz" ADD CONSTRAINT "notifikasi_ustadz_ustadz_id_users_id_fk" FOREIGN KEY ("ustadz_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi_ustadz" ADD CONSTRAINT "notifikasi_ustadz_setoran_id_setoran_id_fk" FOREIGN KEY ("setoran_id") REFERENCES "public"."setoran"("id") ON DELETE cascade ON UPDATE no action;
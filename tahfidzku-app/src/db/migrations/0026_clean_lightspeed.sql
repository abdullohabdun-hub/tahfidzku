CREATE TABLE "notifikasi_gagal_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"konteks" varchar(100) NOT NULL,
	"referensi_id" uuid,
	"error_message" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifikasi_gagal_log" ADD CONSTRAINT "notifikasi_gagal_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
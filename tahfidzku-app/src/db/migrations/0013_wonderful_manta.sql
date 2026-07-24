CREATE TYPE "public"."billing_action" AS ENUM('aktifkan', 'suspend', 'perpanjang_trial', 'ubah_catatan', 'approve', 'reject');--> statement-breakpoint
CREATE TYPE "public"."sumber_setoran" AS ENUM('ustadz', 'santri_self_report');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('pending', 'trial', 'aktif', 'suspend', 'rejected');--> statement-breakpoint

CREATE TABLE "rapor_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nama_lembaga" varchar(255),
	"alamat_lembaga" text,
	"logo_url" varchar(500),
	"kota_cetak" varchar(100),
	"nama_mudir" varchar(255),
	"nip_mudir" varchar(50),
	"catatan_footer" text,
	"label_penilaian" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rapor_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
DROP INDEX "uniq_sesi_kelas_tanggal";--> statement-breakpoint
ALTER TABLE "sesi_kelas" ADD COLUMN "waktu_sesi" "waktu_sesi" NOT NULL;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "sesi_kelas_id" uuid;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "skor_kualitas" integer;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "status_hafalan" varchar(20);--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "ditinjau_oleh_ustadz" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "ditinjau_pada" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "respon_ustadz" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_password_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_token_hash" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "force_password_change" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rapor_settings" ADD CONSTRAINT "rapor_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_sesi_kelas_id_sesi_kelas_id_fk" FOREIGN KEY ("sesi_kelas_id") REFERENCES "public"."sesi_kelas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_sesi_kelas_tanggal_waktu" ON "sesi_kelas" USING btree ("kelas_id","tanggal","waktu_sesi");
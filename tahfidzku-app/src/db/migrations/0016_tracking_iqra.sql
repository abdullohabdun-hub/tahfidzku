CREATE TYPE "public"."tahap_santri" AS ENUM('iqra', 'tahfidz');--> statement-breakpoint
CREATE TABLE "setoran_iqra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"santri_id" uuid NOT NULL,
	"sesi_kelas_id" uuid,
	"jilid" integer NOT NULL,
	"halaman_awal" integer NOT NULL,
	"halaman_akhir" integer NOT NULL,
	"skor_kualitas" integer,
	"status_hafalan" varchar(20),
	"catatan" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ujian_iqra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"santri_id" uuid NOT NULL,
	"jilid_diuji" integer NOT NULL,
	"skor" integer,
	"lulus" boolean NOT NULL,
	"catatan" text,
	"uji_oleh_ustadz_id" uuid NOT NULL,
	"tanggal_ujian" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "santri" ADD COLUMN "tahap_santri" "tahap_santri" DEFAULT 'tahfidz' NOT NULL;--> statement-breakpoint
ALTER TABLE "santri" ADD COLUMN "jilid_iqra_terakhir" integer;--> statement-breakpoint
ALTER TABLE "santri" ADD COLUMN "halaman_iqra_terakhir" integer;--> statement-breakpoint
ALTER TABLE "santri" ADD COLUMN "tahap_santri_updated_by" uuid;--> statement-breakpoint
ALTER TABLE "santri" ADD COLUMN "tahap_santri_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "setoran_iqra" ADD CONSTRAINT "setoran_iqra_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran_iqra" ADD CONSTRAINT "setoran_iqra_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran_iqra" ADD CONSTRAINT "setoran_iqra_sesi_kelas_id_sesi_kelas_id_fk" FOREIGN KEY ("sesi_kelas_id") REFERENCES "public"."sesi_kelas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran_iqra" ADD CONSTRAINT "setoran_iqra_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_iqra" ADD CONSTRAINT "ujian_iqra_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_iqra" ADD CONSTRAINT "ujian_iqra_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_iqra" ADD CONSTRAINT "ujian_iqra_uji_oleh_ustadz_id_users_id_fk" FOREIGN KEY ("uji_oleh_ustadz_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri" ADD CONSTRAINT "santri_tahap_santri_updated_by_users_id_fk" FOREIGN KEY ("tahap_santri_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri" DROP COLUMN "target_tanggal_selesai";
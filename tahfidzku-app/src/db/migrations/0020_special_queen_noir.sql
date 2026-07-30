CREATE TYPE "public"."author_role" AS ENUM('admin', 'ustadz', 'santri', 'wali', 'superadmin');--> statement-breakpoint
CREATE TYPE "public"."tiket_kategori" AS ENUM('bug', 'fitur', 'pertanyaan', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."tiket_status" AS ENUM('baru', 'diproses', 'selesai');--> statement-breakpoint
CREATE TABLE "tiket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submitter_id" uuid NOT NULL,
	"submitter_role" "user_role" NOT NULL,
	"kategori" "tiket_kategori" NOT NULL,
	"subject" varchar(150) NOT NULL,
	"message" varchar(2000) NOT NULL,
	"status" "tiket_status" DEFAULT 'baru' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tiket_balasan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tiket_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"author_role" "author_role" NOT NULL,
	"pesan" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tiket" ADD CONSTRAINT "tiket_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiket" ADD CONSTRAINT "tiket_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiket_balasan" ADD CONSTRAINT "tiket_balasan_tiket_id_tiket_id_fk" FOREIGN KEY ("tiket_id") REFERENCES "public"."tiket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiket_balasan" ADD CONSTRAINT "tiket_balasan_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
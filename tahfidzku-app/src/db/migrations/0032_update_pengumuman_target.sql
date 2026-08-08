CREATE TYPE "public"."target_audiens" AS ENUM('semua', 'kelas', 'tahfidz', 'iqra');--> statement-breakpoint
ALTER TABLE "pengumuman" ADD COLUMN "target_audiens" "target_audiens" DEFAULT 'semua' NOT NULL;--> statement-breakpoint
ALTER TABLE "pengumuman" ADD COLUMN "kelas_id" uuid;--> statement-breakpoint
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_kelas_id_kelas_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas"("id") ON DELETE cascade ON UPDATE no action;
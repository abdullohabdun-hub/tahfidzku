ALTER TABLE "santri" ADD COLUMN "posisi_terakhir_updated_by" uuid;--> statement-breakpoint
ALTER TABLE "santri" ADD COLUMN "posisi_terakhir_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "santri" ADD COLUMN "posisi_terakhir_update_note" text;--> statement-breakpoint
ALTER TABLE "santri" ADD CONSTRAINT "santri_posisi_terakhir_updated_by_users_id_fk" FOREIGN KEY ("posisi_terakhir_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
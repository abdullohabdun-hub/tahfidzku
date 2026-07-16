ALTER TABLE "setoran" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "previous_data" jsonb;--> statement-breakpoint
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
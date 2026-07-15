CREATE TYPE "public"."impersonation_target_role" AS ENUM('ustadz', 'santri', 'wali');--> statement-breakpoint
CREATE TABLE "impersonation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"target_role" "impersonation_target_role" NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TYPE "public"."sumber_setoran" AS ENUM('ustadz', 'santri_self_report');--> statement-breakpoint
ALTER TABLE "setoran" ADD COLUMN "sumber" "sumber_setoran" DEFAULT 'ustadz' NOT NULL;--> statement-breakpoint
ALTER TABLE "impersonation_logs" ADD CONSTRAINT "impersonation_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_logs" ADD CONSTRAINT "impersonation_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
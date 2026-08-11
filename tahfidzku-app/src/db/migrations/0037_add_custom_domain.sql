CREATE TYPE "public"."custom_domain_status" AS ENUM('none', 'pending', 'active', 'failed');--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "custom_domain" varchar(255);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "custom_domain_status" "custom_domain_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "custom_domain_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_custom_domain_unique" UNIQUE("custom_domain");
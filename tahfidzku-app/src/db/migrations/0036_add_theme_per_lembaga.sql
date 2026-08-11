ALTER TABLE "tenants" ADD COLUMN "theme_color" varchar(20) DEFAULT '#047857' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "theme_preset" varchar(50);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "theme_configured" boolean DEFAULT false NOT NULL;
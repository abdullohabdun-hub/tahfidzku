ALTER TABLE "santri" ADD COLUMN "jilid_iqra_ujian_pending" integer;--> statement-breakpoint
ALTER TABLE "ujian_iqra" ADD COLUMN "attempt" integer DEFAULT 1 NOT NULL;
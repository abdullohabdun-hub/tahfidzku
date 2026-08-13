CREATE INDEX "idx_absensi_tenant_sesi" ON "absensi" USING btree ("tenant_id","sesi_kelas_id");--> statement-breakpoint
CREATE INDEX "idx_santri_tenant_kelas" ON "santri" USING btree ("tenant_id","kelas_id");--> statement-breakpoint
CREATE INDEX "idx_setoran_tenant_tanggal" ON "setoran" USING btree ("tenant_id","tanggal_setoran");--> statement-breakpoint
CREATE INDEX "idx_setoran_iqra_tenant_tanggal" ON "setoran_iqra" USING btree ("tenant_id","tanggal_setoran");--> statement-breakpoint
CREATE INDEX "idx_ujian_tenant_santri" ON "ujian" USING btree ("tenant_id","santri_id");--> statement-breakpoint
CREATE INDEX "idx_ujian_tenant_juz" ON "ujian" USING btree ("tenant_id","juz");--> statement-breakpoint
CREATE INDEX "idx_ujian_iqra_tenant_santri" ON "ujian_iqra" USING btree ("tenant_id","santri_id");--> statement-breakpoint
CREATE INDEX "idx_ujian_iqra_tenant_jilid" ON "ujian_iqra" USING btree ("tenant_id","jilid_diuji");
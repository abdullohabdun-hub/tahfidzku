import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { absensi, sesiKelas, rekapMingguanSantri } from '../db/schema/absensi'
import { setoran } from '../db/schema'
import { success, handleError } from '../lib/response'
import { sql, eq } from 'drizzle-orm'
import { z } from 'zod'

// Helper function to get Monday of the current week (or a given date)
function getMonday(d: Date) {
  d = new Date(d);
  var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6: 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0,0,0,0);
  return monday;
}

export const precomputeRekapMingguan = createServerFn({ method: 'POST' })
  .validator((d: unknown) => z.object({
    tenantId: z.string().uuid().optional(),
    tanggalAcuan: z.string().optional() // YYYY-MM-DD
  }).optional().default({}).parse(d))
  .handler(async ({ data }) => {
    try {
      // In production, this should be protected by a CRON_SECRET header if called via Vercel Cron
      // For now, we allow it to be triggered by admin or cron

      const dateRef = data?.tanggalAcuan ? new Date(data.tanggalAcuan) : new Date();
      const monday = getMonday(dateRef);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const startDateStr = monday.toISOString().split('T')[0];
      const endDateStr = sunday.toISOString().split('T')[0];

      // Build the query to calculate summary per santri
      // Drizzle ORM does not support complex GROUP BY with FILTER natively very well, 
      // so we use raw SQL or sql`` template literals

      const tenantFilter = data?.tenantId ? sql`AND a.tenant_id = ${data.tenantId}` : sql``;

      // The query calculates stats directly from DB
      const result = await db.execute(sql`
        SELECT
          a.santri_id as "santriId",
          a.tenant_id as "tenantId",
          COUNT(*) FILTER (WHERE a.status IN ('hadir', 'terlambat')) AS total_hadir,
          COUNT(*) FILTER (WHERE a.status = 'izin') AS total_izin,
          COUNT(*) FILTER (WHERE a.status = 'sakit') AS total_sakit,
          COUNT(*) FILTER (WHERE a.status = 'alpa') AS total_alpa,
          COUNT(*) FILTER (WHERE a.status = 'terlambat') AS total_terlambat,
          COUNT(*) FILTER (WHERE a.status = 'hadir_tanpa_setoran') AS total_hadir_tanpa_setoran,
          COUNT(*) FILTER (
            WHERE a.status IN ('hadir', 'terlambat')
            AND EXISTS (
              SELECT 1 FROM setoran s
              WHERE s.santri_id = a.santri_id
                AND (s.sesi_kelas_id = a.sesi_kelas_id OR (s.sesi_kelas_id IS NULL AND s.tanggal_setoran = sk.tanggal))
            )
          ) AS total_hadir_dengan_setoran
        FROM absensi a
        JOIN sesi_kelas sk ON sk.id = a.sesi_kelas_id
        WHERE sk.tanggal >= ${startDateStr} AND sk.tanggal <= ${endDateStr}
        ${tenantFilter}
        GROUP BY a.santri_id, a.tenant_id
      `);

      // Upsert the results to rekap_mingguan_santri
      let upsertedCount = 0;
      for (const row of result.rows) {
        await db.insert(rekapMingguanSantri).values({
          tenantId: row.tenantId as string,
          santriId: row.santriId as string,
          mingguMulai: startDateStr,
          totalHadir: Number(row.total_hadir),
          totalIzin: Number(row.total_izin),
          totalSakit: Number(row.total_sakit),
          totalAlpa: Number(row.total_alpa),
          totalTerlambat: Number(row.total_terlambat),
          totalHadirTanpaSetoran: Number(row.total_hadir_tanpa_setoran),
          totalHadirDenganSetoran: Number(row.total_hadir_dengan_setoran),
          computedAt: new Date()
        }).onConflictDoUpdate({
          target: [rekapMingguanSantri.santriId, rekapMingguanSantri.mingguMulai],
          set: {
            totalHadir: Number(row.total_hadir),
            totalIzin: Number(row.total_izin),
            totalSakit: Number(row.total_sakit),
            totalAlpa: Number(row.total_alpa),
            totalTerlambat: Number(row.total_terlambat),
            totalHadirTanpaSetoran: Number(row.total_hadir_tanpa_setoran),
            totalHadirDenganSetoran: Number(row.total_hadir_dengan_setoran),
            computedAt: new Date()
          }
        });
        upsertedCount++;
      }

      return success({ processedRows: upsertedCount, mingguMulai: startDateStr }, 'Job precompute berhasil dijalankan');
    } catch (err) {
      return handleError(err)
    }
  })

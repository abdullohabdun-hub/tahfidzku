import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../db'
import { sql } from 'drizzle-orm'
import { getAuthSession } from '../middleware/auth.middleware'
import { verifyAksesSantri } from '../lib/authz'
import { AuthenticationError, ForbiddenError, NotFoundError } from '../lib/errors'
import { success, handleError } from '../lib/response'
import { cariHalamanAbsolutUntukAyat } from '../lib/quranMapper'

export const getSantriAnalitik = createServerFn({ method: 'POST' })
  .validator(z.object({ santriId: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()

      // 1. OTORISASI & OWNERSHIP CHECK (Mencegah IDOR, berlaku untuk SEMUA role)
      const tenantId = await verifyAksesSantri(session, data.santriId)


      // 2. FETCH PROFIL SANTRI (Strict Tenant Isolation)
      const profil = await db.query.santri.findFirst({
        where: (s, { eq, and }) => and(eq(s.id, data.santriId), eq(s.tenantId, tenantId))
      })

      if (!profil) {
        throw new NotFoundError('Data santri')
      }

      // 3. KALKULASI SISA HALAMAN
      let halamanAwal = 0;
      let guardStatus = 'ok';

      if (profil.posisiTerakhir) {
        const h = cariHalamanAbsolutUntukAyat(profil.posisiTerakhir.surahNomor, profil.posisiTerakhir.ayat);
        halamanAwal = h || 0;
      } else {
        guardStatus = 'data_belum_cukup'; // Ditolak secara tegas jika posisiTerakhir belum ada
      }
      const sisaHalaman = Math.max(0, 604 - halamanAwal);

      // 4. QUERY PACING (Rolling window 12 minggu, via sesi aktual)
      const paceResult = await db.execute(sql`
        WITH stat_ziyadah AS (
          SELECT 
            COUNT(DISTINCT COALESCE(sesi_kelas_id::text, DATE(created_at)::text)) as total_sesi_ziyadah,
            MIN(created_at) as first_setoran_date,
            SUM(halaman_akhir - halaman_awal + 1) as total_halaman_ziyadah
          FROM setoran
          WHERE santri_id = ${profil.id} 
            AND jenis = 'ziyadah'
            AND created_at >= NOW() - INTERVAL '12 weeks'
        )
        SELECT * FROM stat_ziyadah
      `);
      const row = paceResult.rows ? paceResult.rows[0] : (paceResult as any)[0];
      const totalSesiZiyadah = parseFloat(row?.total_sesi_ziyadah || '0');
      const totalHalamanZiyadah = parseFloat(row?.total_halaman_ziyadah || '0');
      
      let pacePerSesi = 0;
      if (totalSesiZiyadah > 0) {
        pacePerSesi = totalHalamanZiyadah / totalSesiZiyadah;
      }

      let estimasiHariTersisa = null;
      let onTrackStatus = null;

      // 5. EDGE CASE & KALKULASI TARGET
      if (totalSesiZiyadah < 3 || pacePerSesi === 0) {
        guardStatus = 'data_belum_cukup';
      } else if (guardStatus !== 'data_belum_cukup' && row?.first_setoran_date && pacePerSesi > 0) {
         const daysElapsed = (new Date().getTime() - new Date(row.first_setoran_date).getTime()) / 86400000;
         const weeksElapsed = Math.max(1, daysElapsed / 7);
         const sesiPerMingguRataRata = totalSesiZiyadah / weeksElapsed;
         
         const estimasiMingguTersisa = (sisaHalaman / pacePerSesi) / sesiPerMingguRataRata;
         estimasiHariTersisa = estimasiMingguTersisa * 7;

         if (profil.targetTanggalSelesai) {
            const sisaHariTarget = (new Date(profil.targetTanggalSelesai).getTime() - new Date().getTime()) / 86400000;
            onTrackStatus = estimasiHariTersisa <= sisaHariTarget ? 'on_track' : 'tertinggal';
         }
      }

      return success({
        estimasiKhatam: {
          sisaHalaman,
          pacePerSesi,
          estimasiHariTersisa,
          onTrackStatus,
          guardStatus,
          targetTanggalSelesai: profil.targetTanggalSelesai
        }
      }, "Data analitik Fase 1 berhasil dimuat")

    } catch (error) {
      return handleError(error)
    }
  })

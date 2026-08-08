import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { AuthenticationError } from '../lib/errors'
import { success, handleError } from '../lib/response'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export const getUstadzAnalitikData = createServerFn({ method: 'POST' })
  .validator(z.object({ program: z.enum(['all', 'tahfidz', 'iqra']).default('all') }))
  .handler(async ({ data: { program } }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId
      const ustadzId = session.user.id
      
      const programFilter = program === 'all' 
        ? sql`1=1` 
        : program === 'tahfidz' 
          ? sql`(s.tahap_santri IS NULL OR s.tahap_santri != 'iqra')`
          : sql`s.tahap_santri = 'iqra'`

      // 1. Get Santri Binaan for At-Risk and Distribusi Juz
      const santriBinaanData = await db.execute(sql`
        SELECT s.id, s.nama, s.batas_hafalan_juz, s.juz_progress, s.tahap_santri, s.jilid_iqra_terakhir
        FROM santri s
        JOIN kelas k ON s.kelas_id = k.id
        WHERE s.tenant_id = ${tenantId} AND k.ustadz_id = ${ustadzId} AND ${programFilter}
      `)
      const santriBinaan = santriBinaanData.rows || (santriBinaanData as any)

      // 2. Get Last Setoran Date for At-Risk
      const lastSetoranData = await db.execute(sql`
        WITH all_setoran AS (
          SELECT santri_id, created_at FROM setoran
          UNION ALL
          SELECT santri_id, created_at FROM setoran_iqra
        )
        SELECT s.id, s.nama, MAX(st.created_at) as last_setoran
        FROM santri s
        JOIN kelas k ON s.kelas_id = k.id
        LEFT JOIN all_setoran st ON st.santri_id = s.id
        WHERE s.tenant_id = ${tenantId} AND k.ustadz_id = ${ustadzId} AND ${programFilter}
        GROUP BY s.id, s.nama
        HAVING (MAX(st.created_at) < NOW() - INTERVAL '7 days') OR MAX(st.created_at) IS NULL
      `)
      
      const atRisk = (lastSetoranData.rows || (lastSetoranData as any)).map((r: any) => ({
        id: r.id,
        nama: r.nama,
        hariTanpaSetor: r.last_setoran ? Math.floor((new Date().getTime() - new Date(r.last_setoran).getTime()) / (1000 * 3600 * 24)) : 999
      }))

      // 3. Get Data for Trends (Last 7 Days)
      const last7Days = new Date()
      last7Days.setDate(last7Days.getDate() - 6)
      last7Days.setHours(0,0,0,0)
      const last7DaysStr = last7Days.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

      const rawTahfidz = program !== 'iqra' ? await db.execute(sql`
        SELECT st.tanggal_setoran as date, st.skor_kualitas, (st.halaman_akhir - st.halaman_awal + 1) as halaman
        FROM setoran st
        JOIN santri s ON st.santri_id = s.id
        JOIN kelas k ON s.kelas_id = k.id
        WHERE s.tenant_id = ${tenantId} AND k.ustadz_id = ${ustadzId} 
          AND st.tanggal_setoran >= ${last7DaysStr}
      `) : { rows: [] }

      const rawIqra = program !== 'tahfidz' ? await db.execute(sql`
        SELECT st.tanggal_setoran as date, st.skor_kualitas, (st.halaman_akhir - st.halaman_awal + 1) as halaman
        FROM setoran_iqra st
        JOIN santri s ON st.santri_id = s.id
        JOIN kelas k ON s.kelas_id = k.id
        WHERE s.tenant_id = ${tenantId} AND k.ustadz_id = ${ustadzId} 
          AND st.tanggal_setoran >= ${last7DaysStr}
      `) : { rows: [] }

      const allSetoran7Days = [...(rawTahfidz.rows || rawTahfidz as any), ...(rawIqra.rows || rawIqra as any)]

      // Process Charts in memory
      const trenMap = new Map<string, { kualitas: number[], halaman: number }>()
      
      // Initialize map with last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date(last7Days)
        d.setDate(d.getDate() + i)
        const dStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
        trenMap.set(dStr, { kualitas: [], halaman: 0 })
      }

      allSetoran7Days.forEach((s: any) => {
        const dateStr = s.date;
        if (trenMap.has(dateStr)) {
          const entry = trenMap.get(dateStr)!
          if (s.skor_kualitas) entry.kualitas.push(Number(s.skor_kualitas))
          if (s.halaman) entry.halaman += Number(s.halaman)
        }
      })

      const trenKualitas: any[] = []
      const trenHalaman: any[] = []

      Array.from(trenMap.entries()).sort((a,b) => a[0].localeCompare(b[0])).forEach(([date, data]) => {
        const dayName = format(parseISO(date), 'd MMM', { locale: idLocale })
        const avgKualitas = data.kualitas.length > 0 
          ? data.kualitas.reduce((a, b) => a + b, 0) / data.kualitas.length 
          : null

        trenKualitas.push({ name: dayName, avgKualitas: avgKualitas !== null ? Number(avgKualitas.toFixed(1)) : null })
        trenHalaman.push({ name: dayName, totalHalaman: data.halaman })
      })

      // Distribusi Juz / Jilid
      const distribusiMap = new Map<string, number>()
      santriBinaan.forEach((s: any) => {
        const isIqra = s.tahap_santri === 'iqra'
        let label = 'Belum Ada Data'
        
        if (isIqra) {
          if (s.jilid_iqra_terakhir) {
            label = `Jilid ${s.jilid_iqra_terakhir}`
          }
        } else {
          let currentJuz = s.batas_hafalan_juz
          if (!currentJuz && s.juz_progress && s.juz_progress.length > 0) {
            currentJuz = Math.max(...s.juz_progress)
          }
          if (currentJuz) {
            label = `Juz ${currentJuz}`
          }
        }
        
        distribusiMap.set(label, (distribusiMap.get(label) || 0) + 1)
      })

      const distribusiJuz = Array.from(distribusiMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      return success({
        atRisk,
        trenKualitas,
        distribusiJuz,
        trenHalaman,
        isSemuaAktif: atRisk.length === 0
      }, 'Data analitik ustadz berhasil dimuat')

    } catch (err) {
      console.error('ERROR in getUstadzAnalitikData:', err)
      return handleError(err)
    }
  })

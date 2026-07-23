import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { raporSettings, santri, setoran, ujian, absensi, sesiKelas, kelas } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'

// ═══════════════════════════════════════════════════════
// 1. GET RAPOR SETTINGS (admin, ustadz)
// ═══════════════════════════════════════════════════════
export const getRaporSettings = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin', 'ustadz')

      const tenantId = session.user.tenantId

      const result = await db
        .select()
        .from(raporSettings)
        .where(eq(raporSettings.tenantId, tenantId))
        .limit(1)

      // Return null data jika belum pernah diset (bukan error)
      return success(result[0] ?? null, 'Berhasil mengambil pengaturan rapor')
    } catch (err) {
      return handleError(err)
    }
  }
)

// ═══════════════════════════════════════════════════════
// 2. UPSERT RAPOR SETTINGS (admin saja)
// ═══════════════════════════════════════════════════════
export const upsertRaporSettings = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      namaLembaga:   z.string().max(255).optional(),
      alamatLembaga: z.string().optional(),
      logoUrl:       z.string().url('URL logo tidak valid').max(500).optional().or(z.literal('')),
      kotaCetak:     z.string().max(100).optional(),
      namaMudir:     z.string().max(255).optional(),
      nipMudir:      z.string().max(50).optional(),
      catatanFooter: z.string().optional(),
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const tenantId = session.user.tenantId

      // Cek apakah sudah ada record untuk tenant ini
      const existing = await db
        .select({ id: raporSettings.id })
        .from(raporSettings)
        .where(eq(raporSettings.tenantId, tenantId))
        .limit(1)

      if (existing.length > 0) {
        // Update
        await db
          .update(raporSettings)
          .set({
            ...data,
            // Normalize logoUrl: simpan null jika kosong agar tidak menyimpan string kosong
            logoUrl: data.logoUrl && data.logoUrl.length > 0 ? data.logoUrl : null,
            updatedAt: new Date(),
          })
          .where(eq(raporSettings.tenantId, tenantId))
      } else {
        // Insert baru
        await db
          .insert(raporSettings)
          .values({
            tenantId,
            ...data,
            logoUrl: data.logoUrl && data.logoUrl.length > 0 ? data.logoUrl : null,
          })
      }

      return success(null, 'Pengaturan rapor berhasil disimpan')
    } catch (err) {
      return handleError(err)
    }
  })

// ═══════════════════════════════════════════════════════
// 3. GET DATA RAPOR SANTRI (admin, ustadz)
// ═══════════════════════════════════════════════════════
export const getSantriRaporData = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      santriId: z.string().uuid('santriId tidak valid'),
      mode: z.enum(['bulanan', 'semester_ganjil', 'semester_genap', 'tahunan']).optional().default('bulanan'),
      tahunAjaran: z.number().int().min(2020).max(2100).optional(),
      bulan: z.number().int().min(1).max(12).optional(),
      tahun: z.number().int().min(2020).max(2100).optional(), // fallback UI lama
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin', 'ustadz')

      const tenantId = session.user.tenantId
      const { santriId, mode } = data

      // Hitung range tanggal berdasarkan mode
      let awalBulan: Date, akhirBulan: Date, periodeLabel: string;
      const year = data.tahunAjaran || data.tahun || new Date().getFullYear();

      if (mode === 'bulanan') {
        const m = data.bulan || new Date().getMonth() + 1;
        awalBulan = new Date(year, m - 1, 1);
        akhirBulan = new Date(year, m, 1);
        const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        periodeLabel = `${NAMA_BULAN[m - 1]} ${year}`;
      } else if (mode === 'semester_ganjil') {
        awalBulan = new Date(year, 6, 1); // 1 Jul
        akhirBulan = new Date(year + 1, 0, 1); // 1 Jan thn depan
        periodeLabel = `Semester Ganjil ${year}/${year + 1}`;
      } else if (mode === 'semester_genap') {
        awalBulan = new Date(year + 1, 0, 1); // 1 Jan thn depan
        akhirBulan = new Date(year + 1, 6, 1); // 1 Jul thn depan
        periodeLabel = `Semester Genap ${year}/${year + 1}`;
      } else {
        awalBulan = new Date(year, 6, 1); // 1 Jul
        akhirBulan = new Date(year + 1, 6, 1); // 1 Jul thn depan
        periodeLabel = `Tahun Ajaran ${year}/${year + 1}`;
      }

      const formatYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

      // --- 1. Profil Santri ---
      const [profilSantri] = await db.query.santri.findMany({
        where: and(eq(santri.id, santriId), eq(santri.tenantId, tenantId)),
        with: { kelas: { columns: { nama: true } } },
        limit: 1,
      })

      if (!profilSantri) {
        throw new ValidationError('Data santri tidak ditemukan atau akses ditolak')
      }

      // --- 2. Setoran pada periode ---
      let setoranByJenis = { ziyadah: [] as any[], sabqi: [] as any[], manzil: [] as any[] }
      let rekapBulanan: any[] = []

      if (mode === 'bulanan') {
        const daftarSetoran = await db.query.setoran.findMany({
          where: and(
            eq(setoran.santriId, santriId),
            eq(setoran.tenantId, tenantId),
            sql`${setoran.createdAt} >= ${awalBulan}`,
            sql`${setoran.createdAt} < ${akhirBulan}`
          ),
          with: { ustadz: { columns: { nama: true } } },
          orderBy: [desc(setoran.createdAt)],
        })
        setoranByJenis.ziyadah = daftarSetoran.filter(s => s.jenis === 'ziyadah')
        setoranByJenis.sabqi = daftarSetoran.filter(s => s.jenis === 'sabqi')
        setoranByJenis.manzil = daftarSetoran.filter(s => s.jenis === 'manzil')
      } else {
        // Mode Semester/Tahunan: Agregasi SQL (hindari N+1 data harian)
        const aggregasi = await db
          .select({
            bulan: sql<string>`TO_CHAR(${setoran.createdAt} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM')`,
            jenis: setoran.jenis,
            total: sql<number>`CAST(COUNT(*) AS INTEGER)`,
            avgSkor: sql<number>`AVG(${setoran.skorKualitas})`,
          })
          .from(setoran)
          .where(and(
            eq(setoran.santriId, santriId),
            eq(setoran.tenantId, tenantId),
            sql`${setoran.createdAt} >= ${awalBulan}`,
            sql`${setoran.createdAt} < ${akhirBulan}`
          ))
          .groupBy(sql`1, 2`)

        const map = new Map<string, any>()
        // Inisialisasi bulan kosong agar tampil berurutan
        let tempDate = new Date(awalBulan)
        while (tempDate < akhirBulan) {
          const blnKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`
          map.set(blnKey, { bulan: blnKey, ziyadah: 0, sabqi: 0, manzil: 0, totalSkor: 0, countSkor: 0 })
          tempDate.setMonth(tempDate.getMonth() + 1)
        }

        aggregasi.forEach(row => {
          if (map.has(row.bulan)) {
            const data = map.get(row.bulan)
            if (row.jenis === 'ziyadah') data.ziyadah += row.total
            if (row.jenis === 'sabqi') data.sabqi += row.total
            if (row.jenis === 'manzil') data.manzil += row.total
            if (row.avgSkor != null && row.avgSkor > 0) {
              data.totalSkor += (Number(row.avgSkor) * row.total)
              data.countSkor += row.total
            }
          }
        })

        rekapBulanan = Array.from(map.values()).map(d => ({
          bulan: d.bulan,
          ziyadah: d.ziyadah,
          sabqi: d.sabqi,
          manzil: d.manzil,
          rataRataSkor: d.countSkor > 0 ? Number((d.totalSkor / d.countSkor).toFixed(1)) : null
        }))
      }

      // --- 3. Ujian Kenaikan Juz pada periode ---
      const daftarUjian = await db.query.ujian.findMany({
        where: and(
          eq(ujian.santriId, santriId),
          eq(ujian.tenantId, tenantId),
          sql`${ujian.createdAt} >= ${awalBulan}`,
          sql`${ujian.createdAt} < ${akhirBulan}`
        ),
        with: { ustadz: { columns: { nama: true } } },
        orderBy: [desc(ujian.createdAt)],
      })

      // --- 4. Rekap Absensi pada periode ---
      const sesiDalamPeriode = await db
        .select({ id: sesiKelas.id })
        .from(sesiKelas)
        .where(
          and(
            eq(sesiKelas.tenantId, tenantId),
            sql`${sesiKelas.tanggal} >= ${formatYMD(awalBulan)}`,
            sql`${sesiKelas.tanggal} < ${formatYMD(akhirBulan)}`
          )
        )

      const sesiIds = sesiDalamPeriode.map(s => s.id)
      let rekapAbsensi = { hadir: 0, izin: 0, sakit: 0, alpa: 0, terlambat: 0, total: 0 }

      if (sesiIds.length > 0) {
        const absensiRecords = await db
          .select({ status: absensi.status })
          .from(absensi)
          .where(and(
            eq(absensi.santriId, santriId),
            eq(absensi.tenantId, tenantId),
            inArray(absensi.sesiKelasId, sesiIds)
          ))

        absensiRecords.forEach(r => {
          rekapAbsensi[r.status as keyof typeof rekapAbsensi]++
          rekapAbsensi.total++
        })
      }

      // --- 5. Hitung Historis Progres Hafalan ---
      const ujianHistoris = await db
        .select({ juz: ujian.juz })
        .from(ujian)
        .where(
          and(
            eq(ujian.santriId, santriId),
            eq(ujian.tenantId, tenantId),
            eq(ujian.status, 'lulus'),
            sql`${ujian.createdAt} < ${akhirBulan}`
          )
        )
      const historicalJuzProgress = Array.from(new Set(ujianHistoris.map(u => u.juz))).sort((a, b) => a - b)

      // --- 6. Pengaturan Rapor Lembaga ---
      let settingLembaga = null
      try {
        const result = await db.select().from(raporSettings).where(eq(raporSettings.tenantId, tenantId)).limit(1)
        settingLembaga = result[0] ?? null
      } catch (e: any) { }

      return success({
        profil: {
          id:           profilSantri.id,
          nama:         profilSantri.nama,
          kelasNama:    profilSantri.kelas?.nama ?? null,
          targetJuz:    profilSantri.targetJuz,
          juzSelesai:   historicalJuzProgress.length,
          juzProgress:  historicalJuzProgress,
        },
        periode: { 
          label: periodeLabel, 
          mode, 
          tahunAjaran: year, 
          bulan: data.bulan 
        },
        setoran: setoranByJenis,
        rekapBulanan,
        ujian: daftarUjian,
        absensi: rekapAbsensi,
        raporSettings: settingLembaga,
      }, 'Berhasil mengambil data rapor santri')
    } catch (err) {
      return handleError(err)
    }
  })

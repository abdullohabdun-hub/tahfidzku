import { createServerFn } from '@tanstack/react-start'
import { and, eq, desc, gte, sql, inArray } from 'drizzle-orm'
import { db } from '../db'
import { santri, setoran, setoranIqra, users, kelas, tenants, waliSantri } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ForbiddenError } from '../lib/errors'
import { hitungProgresHalaman, kalkulasiJuzProgress } from '../lib/quranMapper'
import { hitungDailyStreak, hitungWeeklyStreak } from '../lib/streak'
import { getSantriDisplayMode } from '../lib/santri-display'
import { getTodayWIB } from '../lib/dateUtils'

export const getAdminDashboardStats = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const tenantId = session.user.tenantId

      const [tenantInfo] = await db.select({ status: tenants.status, trialEndsAt: tenants.trialEndsAt }).from(tenants).where(eq(tenants.id, tenantId)).limit(1)

      const santriList = await db.select({ id: santri.id }).from(santri).where(eq(santri.tenantId, tenantId))
      const ustadzList = await db.select({ id: users.id }).from(users).where(and(eq(users.tenantId, tenantId), eq(users.role, 'ustadz')))
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const setoranHariIniList = await db
        .select({ id: setoran.id })
        .from(setoran)
        .where(and(eq(setoran.tenantId, tenantId), eq(setoran.tanggalSetoran, getTodayWIB())))

      const setoranIqraHariIniList = await db
        .select({ id: setoranIqra.id })
        .from(setoranIqra)
        .where(and(eq(setoranIqra.tenantId, tenantId), eq(setoranIqra.tanggalSetoran, getTodayWIB())))

      const unionQuery = sql`
        (
          SELECT s.id, s.santri_id as "santriId", 'tahfidz' as tipe, s.created_at as "createdAt", sa.nama as "santriNama",
            s.jenis, s.surah, s.juz, s.juz_mulai as "juzMulai", s.juz_selesai as "juzSelesai", s.lintas_juz as "lintasJuz",
            s.ayat_awal as "ayatAwal", s.ayat_akhir as "ayatAkhir", s.halaman_awal as "halamanAwal", s.halaman_akhir as "halamanAkhir",
            NULL as jilid, s.skor_kualitas as "skorKualitas", s.status_hafalan as "statusHafalan"
          FROM setoran s
          JOIN santri sa ON s.santri_id = sa.id
          WHERE s.tenant_id = ${tenantId}
          ORDER BY s.created_at DESC LIMIT 5
        )
        UNION ALL
        (
          SELECT si.id, si.santri_id as "santriId", 'iqra' as tipe, si.created_at as "createdAt", sa.nama as "santriNama",
            NULL as jenis, NULL as surah, NULL as juz, NULL as "juzMulai", NULL as "juzSelesai", false as "lintasJuz",
            NULL as "ayatAwal", NULL as "ayatAkhir", si.halaman_awal as "halamanAwal", si.halaman_akhir as "halamanAkhir",
            si.jilid as jilid, si.skor_kualitas as "skorKualitas", si.status_hafalan as "statusHafalan"
          FROM setoran_iqra si
          JOIN santri sa ON si.santri_id = sa.id
          WHERE si.tenant_id = ${tenantId}
          ORDER BY si.created_at DESC LIMIT 5
        )
        ORDER BY "createdAt" DESC LIMIT 5
      `;
      
      const { rows } = await db.execute(unionQuery);
      
      // format for frontend
      const formattedRecent = rows.map((r: any) => ({
        id: r.id,
        santriId: r.santriId,
        tipe: r.tipe,
        createdAt: new Date(r.createdAt),
        santriNama: r.santriNama,
        jenis: r.jenis,
        surah: r.surah,
        juz: r.juz,
        juzMulai: r.juzMulai,
        juzSelesai: r.juzSelesai,
        lintasJuz: r.lintasJuz,
        ayatAwal: r.ayatAwal,
        ayatAkhir: r.ayatAkhir,
        halamanAwal: r.halamanAwal,
        halamanAkhir: r.halamanAkhir,
        jilid: r.jilid,
        skorKualitas: r.skorKualitas,
        statusHafalan: r.statusHafalan
      }))

      return success({
        totalSantri: santriList.length,
        totalUstadz: ustadzList.length,
        totalSetoranHariIni: setoranHariIniList.length + setoranIqraHariIniList.length,
        recentSetoran: formattedRecent,
        tenantStatus: tenantInfo?.status || 'aktif',
        trialEndsAt: tenantInfo?.trialEndsAt || null,
      }, 'Berhasil mengambil statistik dashboard')
    } catch (err) {
      return handleError(err)
    }
  }
)

export const getUstadzDashboard = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const santriBinaan = await db
        .select({
          id: santri.id,
          nama: santri.nama,
          targetJuz: santri.targetJuz,
          tahapSantri: santri.tahapSantri,
          jilidIqraTerakhir: santri.jilidIqraTerakhir,
        })
        .from(santri)
        .innerJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(
          and(
            eq(santri.tenantId, tenantId),
            eq(kelas.ustadzId, session.user.id)
          )
        )

      const setoranHariIniData = await db.query.setoran.findMany({
        where: and(
          eq(setoran.tenantId, tenantId),
          eq(setoran.ustadzId, session.user.id),
          eq(setoran.tanggalSetoran, getTodayWIB())
        ),
        orderBy: [desc(setoran.tanggalSetoran), desc(setoran.createdAt)],
        with: {
          santri: { columns: { nama: true } }
        }
      })

      const setoranIqraHariIniData = await db.query.setoranIqra.findMany({
        where: and(
          eq(setoranIqra.tenantId, tenantId),
          eq(setoranIqra.createdBy, session.user.id),
          eq(setoranIqra.tanggalSetoran, getTodayWIB())
        ),
        orderBy: [desc(setoranIqra.createdAt)],
        with: {
          santri: { columns: { nama: true } }
        }
      })

      const setoranHariIni = [
        ...setoranHariIniData.map(s => ({ ...s, santriNama: s.santri.nama, tipe: 'tahfidz' as const })),
        ...setoranIqraHariIniData.map(s => ({ ...s, santriNama: s.santri.nama, tipe: 'iqra' as const }))
      ]
      
      setoranHariIni.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      const sudahSetorIds = setoranHariIni.map((s) => s.santriId)
      const belumSetor = santriBinaan.filter((s) => !sudahSetorIds.includes(s.id)).map(s => ({
        ...s,
        displayMode: getSantriDisplayMode(s)
      }))

      return success(
        {
          namaUstadz: session.user.nama,
          totalSantri: santriBinaan.length,
          totalSetoran: setoranHariIni.length,
          setoranTerbaru: setoranHariIni.slice(0, 5),
          belumSetor: belumSetor.slice(0, 5),
        },
        'Dashboard berhasil dimuat',
      )
    } catch (err) {
      return handleError(err)
    }
  }
)

export const getSantriDashboardData = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      const santriId = session.user.santriId
      if (!santriId) throw new Error('Anda tidak memiliki profil santri.')

      const [profil] = await db.select().from(santri).where(eq(santri.id, santriId)).limit(1)
      if (!profil) throw new Error('Profil santri tidak ditemukan.')

      const displayMode = getSantriDisplayMode(profil)

      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 6);
      last7Days.setHours(0,0,0,0);
      const last7DaysStr = last7Days.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      
      const duaTahunLalu = new Date()
      duaTahunLalu.setDate(duaTahunLalu.getDate() - 730)
      const duaTahunLaluStr = duaTahunLalu.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

      if (displayMode === 'iqra') {
        const riwayat = await db.query.setoranIqra.findMany({
          where: eq(setoranIqra.santriId, santriId),
          orderBy: [desc(setoranIqra.createdAt)],
          limit: 5
        })

        const jilidSekarang = profil.jilidIqraTerakhir || 1
        const halamanSekarang = profil.halamanIqraTerakhir || 0
        const progressPercentage = Math.round((jilidSekarang / 6) * 100)

        const setoran7Hari = await db.query.setoranIqra.findMany({
          where: and(
            eq(setoranIqra.santriId, santriId),
            gte(setoranIqra.tanggalSetoran, last7DaysStr)
          )
        })

        const iqraChart = Array(7).fill(0).map((_, i) => {
          const d = new Date(last7Days);
          d.setDate(d.getDate() + i);
          return { 
            name: d.toLocaleDateString('id-ID', { weekday: 'short' }), 
            date: d.toISOString().split('T')[0],
            halaman: 0 
          };
        });

        for (const s of setoran7Hari) {
          const sDate = s.tanggalSetoran;
          const dayIdx = iqraChart.findIndex(d => d.date === sDate);
          if (dayIdx !== -1) {
            let pages = Math.max(0, s.halamanAkhir - s.halamanAwal + 1);
            iqraChart[dayIdx].halaman += pages;
          }
        }

        const riwayatStreak = await db.query.setoranIqra.findMany({
          where: and(
            eq(setoranIqra.santriId, santriId),
            gte(setoranIqra.tanggalSetoran, duaTahunLaluStr)
          ),
          orderBy: [desc(setoranIqra.createdAt)],
          columns: { createdAt: true }
        })

        const rawDates = riwayatStreak.map(s => s.createdAt)
        const streakMode = profil.tipe === 'reguler' ? 'daily' : 'weekly'
        const calculatedStreak = streakMode === 'daily' 
          ? hitungDailyStreak(rawDates) 
          : hitungWeeklyStreak(rawDates)

        return success({
          displayMode,
          profil,
          riwayat,
          progress: {
            jilidSekarang,
            halamanSekarang,
            percentage: progressPercentage,
          },
          analitikChart: iqraChart,
          streak: calculatedStreak,
          streakMode: streakMode,
        }, "Data dashboard Iqra berhasil diambil")

      } else {
        const riwayat = await db.query.setoran.findMany({
          where: eq(setoran.santriId, santriId),
          orderBy: [desc(setoran.tanggalSetoran), desc(setoran.createdAt)],
          limit: 5
        })

        const targetJuz = profil?.targetJuz || 30
        const juzSelesai = profil ? kalkulasiJuzProgress(profil.urutanHafalan || [], profil.posisiTerakhir, profil.juzUjianPending).length : 0
        
        let progressPercentage = Math.round((juzSelesai / targetJuz) * 100)
        try {
          if (profil?.urutanHafalan && profil?.posisiTerakhir) {
            const progresHal = hitungProgresHalaman(profil.urutanHafalan, profil.posisiTerakhir)
            progressPercentage = progresHal.persen
          }
        } catch (err) {
          progressPercentage = Math.round((juzSelesai / targetJuz) * 100)
        }

        const setoran7Hari = await db.query.setoran.findMany({
          where: and(
            eq(setoran.santriId, santriId),
            gte(setoran.tanggalSetoran, last7DaysStr)
          )
        })
        
        const murojaahChart = Array(7).fill(0).map((_, i) => {
          const d = new Date(last7Days);
          d.setDate(d.getDate() + i);
          return { 
            name: d.toLocaleDateString('id-ID', { weekday: 'short' }), 
            date: d.toISOString().split('T')[0],
            halaman: 0 
          };
        });

        for (const s of setoran7Hari) {
          if (s.jenis === 'sabqi' || s.jenis === 'manzil') {
            const sDate = s.tanggalSetoran;
            const dayIdx = murojaahChart.findIndex(d => d.date === sDate);
            if (dayIdx !== -1) {
              let pages = 0;
              if (s.halamanAwal != null && s.halamanAkhir != null) {
                pages = Math.max(0, s.halamanAkhir - s.halamanAwal + 1);
              }
              murojaahChart[dayIdx].halaman += pages;
            }
          }
        }

        const riwayatStreak = await db.query.setoran.findMany({
          where: and(
            eq(setoran.santriId, santriId),
            gte(setoran.tanggalSetoran, duaTahunLaluStr)
          ),
          orderBy: [desc(setoran.tanggalSetoran), desc(setoran.createdAt)],
          columns: { tanggalSetoran: true }
        })

        const rawDates = riwayatStreak.map(s => new Date(s.tanggalSetoran))
        const streakMode = profil?.tipe === 'reguler' ? 'daily' : 'weekly'
        const calculatedStreak = streakMode === 'daily' 
          ? hitungDailyStreak(rawDates) 
          : hitungWeeklyStreak(rawDates)

        return success({
          displayMode,
          profil,
          riwayat,
          progress: {
            targetJuz,
            juzSelesai,
            percentage: progressPercentage,
          },
          analitikChart: murojaahChart,
          streak: calculatedStreak,
          streakMode: streakMode,
        }, "Data dashboard Tahfidz berhasil diambil")
      }
    } catch (err) {
      return handleError(err)
    }
  }
)

export { getSantriDashboardData as getSantriDashboard }

export const getWaliDashboard = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'wali')

      let santriIds: string[] = []
      
      const anakLinks = await db.select({ santriId: waliSantri.santriId }).from(waliSantri).where(eq(waliSantri.waliUserId, session.user.id))
      
      if (anakLinks.length > 0) {
        santriIds = anakLinks.map(link => link.santriId)
      } else if (session.user.santriId) {
        santriIds = [session.user.santriId]
      }

      if (santriIds.length === 0) throw new Error('Akun Wali ini belum terhubung ke data anak (santri).')

      const daftarAnak = []
      const duaTahunLalu = new Date()
      duaTahunLalu.setDate(duaTahunLalu.getDate() - 730)
      const duaTahunLaluStr = duaTahunLalu.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

      for (const santriId of santriIds) {
        const [profil] = await db.select().from(santri).where(eq(santri.id, santriId)).limit(1)
        if (!profil) continue;

        let namaKelas = null;
        if (profil.kelasId) {
          const [kelasObj] = await db.select({ nama: kelas.nama }).from(kelas).where(eq(kelas.id, profil.kelasId)).limit(1)
          if (kelasObj) namaKelas = kelasObj.nama;
        }

        const displayMode = getSantriDisplayMode(profil)

        if (displayMode === 'iqra') {
          const riwayat = await db.query.setoranIqra.findMany({
            where: eq(setoranIqra.santriId, santriId),
            orderBy: [desc(setoranIqra.createdAt)],
            limit: 10,
            with: {
              createdBy: { columns: { nama: true } }
            }
          })

          const jilidSekarang = profil.jilidIqraTerakhir || 1
          const halamanSekarang = profil.halamanIqraTerakhir || 0
          const progressPercentage = Math.round((jilidSekarang / 6) * 100)

          const riwayatStreak = await db.query.setoranIqra.findMany({
            where: and(
              eq(setoranIqra.santriId, santriId),
              gte(setoranIqra.tanggalSetoran, duaTahunLaluStr)
            ),
            orderBy: [desc(setoranIqra.createdAt)],
            columns: { createdAt: true }
          })
  
          const rawDates = riwayatStreak.map(s => s.createdAt)
          const streakMode = profil.tipe === 'reguler' ? 'daily' : 'weekly'
          const calculatedStreak = streakMode === 'daily' 
            ? hitungDailyStreak(rawDates) 
            : hitungWeeklyStreak(rawDates)

          daftarAnak.push({
            displayMode,
            profil: { ...profil, namaKelas },
            riwayat: riwayat.map(r => ({ ...r, ustadzNama: r.createdBy?.nama || 'Ustadz' })),
            progress: {
              jilidSekarang,
              halamanSekarang,
              percentage: progressPercentage,
            },
            streak: calculatedStreak,
            streakMode: streakMode
          })
        } else {
          const riwayat = await db.query.setoran.findMany({
            where: eq(setoran.santriId, santriId),
            orderBy: [desc(setoran.tanggalSetoran), desc(setoran.createdAt)],
            limit: 10,
            with: {
              ustadz: { columns: { nama: true } }
            }
          })

          const targetJuz = profil.targetJuz || 30
          const juzSelesai = kalkulasiJuzProgress(profil.urutanHafalan || [], profil.posisiTerakhir, profil.juzUjianPending).length
          
          let progressPercentage = Math.round((juzSelesai / targetJuz) * 100)
          try {
            if (profil.urutanHafalan && profil.posisiTerakhir) {
              const progresHal = hitungProgresHalaman(profil.urutanHafalan, profil.posisiTerakhir)
              progressPercentage = progresHal.persen
            }
          } catch (err) {
            progressPercentage = Math.round((juzSelesai / targetJuz) * 100)
          }

          const riwayatStreak = await db.query.setoran.findMany({
            where: and(
              eq(setoran.santriId, santriId),
              gte(setoran.tanggalSetoran, duaTahunLaluStr)
            ),
            orderBy: [desc(setoran.tanggalSetoran), desc(setoran.createdAt)],
            columns: { tanggalSetoran: true }
          })
  
          const rawDates = riwayatStreak.map(s => new Date(s.tanggalSetoran))
          const streakMode = profil.tipe === 'reguler' ? 'daily' : 'weekly'
          const calculatedStreak = streakMode === 'daily' 
            ? hitungDailyStreak(rawDates) 
            : hitungWeeklyStreak(rawDates)

          daftarAnak.push({
            displayMode,
            profil: { ...profil, namaKelas },
            riwayat: riwayat.map(r => ({ ...r, ustadzNama: r.ustadz?.nama || 'Ustadz' })),
            progress: {
              targetJuz,
              juzSelesai,
              percentage: progressPercentage,
            },
            streak: calculatedStreak,
            streakMode: streakMode
          })
        }
      }
      
      if (daftarAnak.length === 0) throw new Error('Data anak tidak ditemukan.')

      return success({
        daftarAnak
      }, "Data dashboard wali berhasil diambil")
    } catch (err) {
      return handleError(err)
    }
  }
)

export const getAgregatSantriDashboard = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      
      if (!['admin', 'ustadz'].includes(session.user.role)) {
        throw new ForbiddenError('Akses ditolak: hanya Admin dan Ustadz.') 
      }

      const tenantId = session.user.tenantId
      const isUstadz = session.user.role === 'ustadz'

      const santriScope = await db.select({
        id: santri.id,
        kelasId: santri.kelasId,
      }).from(santri)
        .leftJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(and(
          eq(santri.tenantId, tenantId),
          isUstadz ? eq(kelas.ustadzId, session.user.id) : undefined
        ))
        
      const santriIds = santriScope.map(s => s.id)
      const totalSantriAktif = santriIds.length

      if (totalSantriAktif === 0) {
        return success({
          totalSantriAktif: 0,
          totalSetoran7Hari: 0,
          santriTanpaSetoran: 0,
          rataKehadiranPersen: 0,
          totalSesiAbsensi: 0,
          setoranHarian: [],
          trendHalaman: {
            mingguIni: 0,
            mingguLalu: 0,
            selisih: 0
          }
        }, "Tidak ada data santri.")
      }

      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      const last7DaysStart = new Date(today)
      last7DaysStart.setDate(today.getDate() - 6)
      last7DaysStart.setHours(0,0,0,0)

      const last14DaysStart = new Date(today)
      last14DaysStart.setDate(today.getDate() - 13)
      last14DaysStart.setHours(0,0,0,0)

      const last7DaysStr = last7DaysStart.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      const last14DaysStr = last14DaysStart.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

      const setoran7Hari = await db.query.setoran.findMany({
        where: and(
          eq(setoran.tenantId, tenantId),
          gte(setoran.tanggalSetoran, last7DaysStr),
          sql`${setoran.tanggalSetoran} <= ${todayStr}`,
          isUstadz ? inArray(setoran.santriId, santriIds) : undefined
        )
      })

      const setoranIqra7Hari = await db.query.setoranIqra.findMany({
        where: and(
          eq(setoranIqra.tenantId, tenantId),
          gte(setoranIqra.tanggalSetoran, last7DaysStr),
          sql`${setoranIqra.tanggalSetoran} <= ${todayStr}`,
          isUstadz ? inArray(setoranIqra.santriId, santriIds) : undefined
        )
      })

      const validSetoran7Hari = setoran7Hari.filter(s => santriIds.includes(s.santriId))
      const validSetoranIqra7Hari = setoranIqra7Hari.filter(s => santriIds.includes(s.santriId))
      const totalSetoran7Hari = validSetoran7Hari.length + validSetoranIqra7Hari.length

      const santriYangSetor = new Set([
        ...validSetoran7Hari.map(s => s.santriId),
        ...validSetoranIqra7Hari.map(s => s.santriId)
      ])
      const santriTanpaSetoran = totalSantriAktif - santriYangSetor.size

      const setoran14Hari = await db.query.setoran.findMany({
        where: and(
          eq(setoran.tenantId, tenantId),
          gte(setoran.tanggalSetoran, last14DaysStr),
          sql`${setoran.tanggalSetoran} < ${last7DaysStr}`,
          isUstadz ? inArray(setoran.santriId, santriIds) : undefined
        )
      })
      const setoranIqra14Hari = await db.query.setoranIqra.findMany({
        where: and(
          eq(setoranIqra.tenantId, tenantId),
          gte(setoranIqra.tanggalSetoran, last14DaysStr),
          sql`${setoranIqra.tanggalSetoran} < ${last7DaysStr}`,
          isUstadz ? inArray(setoranIqra.santriId, santriIds) : undefined
        )
      })

      const validSetoran14Hari = setoran14Hari.filter(s => santriIds.includes(s.santriId))
      const validSetoranIqra14Hari = setoranIqra14Hari.filter(s => santriIds.includes(s.santriId))

      let halamanMingguIni = 0
      let halamanMingguLalu = 0

      for (const s of validSetoran7Hari) {
        if (s.halamanAkhir != null && s.halamanAwal != null) halamanMingguIni += Math.max(0, s.halamanAkhir - s.halamanAwal + 1)
      }
      for (const s of validSetoranIqra7Hari) {
        if (s.halamanAkhir != null && s.halamanAwal != null) halamanMingguIni += Math.max(0, s.halamanAkhir - s.halamanAwal + 1)
      }
      for (const s of validSetoran14Hari) {
        if (s.halamanAkhir != null && s.halamanAwal != null) halamanMingguLalu += Math.max(0, s.halamanAkhir - s.halamanAwal + 1)
      }
      for (const s of validSetoranIqra14Hari) {
        if (s.halamanAkhir != null && s.halamanAwal != null) halamanMingguLalu += Math.max(0, s.halamanAkhir - s.halamanAwal + 1)
      }

      const setoranHarian = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(last7DaysStart)
        d.setDate(d.getDate() + i)
        const tanggal = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
        const nama = d.toLocaleDateString('id-ID', { weekday: 'short' })
        const jumlah = [
          ...validSetoran7Hari.filter(s => s.tanggalSetoran === tanggal),
          ...validSetoranIqra7Hari.filter(s => s.tanggalSetoran === tanggal),
        ].length
        return { tanggal, nama, jumlah }
      })

      const absensiQuery = sql`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN a.status IN ('hadir', 'terlambat', 'hadir_tanpa_setoran') THEN 1 ELSE 0 END) as hadir
        FROM absensi a
        JOIN sesi_kelas sk ON a.sesi_kelas_id = sk.id
        JOIN santri s ON a.santri_id = s.id
        LEFT JOIN kelas k ON s.kelas_id = k.id
        WHERE a.tenant_id = ${tenantId}
          AND sk.tanggal >= ${last7DaysStr}
          AND sk.tanggal <= ${todayStr}
          ${isUstadz ? sql`AND k.ustadz_id = ${session.user.id}` : sql``}
      `
      const { rows: absensiRows } = await db.execute(absensiQuery)
      
      const totalSesi = parseInt(absensiRows[0]?.total as string || '0')
      const totalHadir = parseInt(absensiRows[0]?.hadir as string || '0')
      const rataKehadiranPersen = totalSesi > 0 ? Math.round((totalHadir / totalSesi) * 100) : 0

      return success({
        totalSantriAktif,
        totalSetoran7Hari,
        santriTanpaSetoran,
        rataKehadiranPersen,
        totalSesiAbsensi: totalSesi,
        setoranHarian,
        trendHalaman: {
          mingguIni: halamanMingguIni,
          mingguLalu: halamanMingguLalu,
          selisih: halamanMingguIni - halamanMingguLalu
        }
      }, "Berhasil mengambil agregat dashboard")
    } catch (err) {
      return handleError(err)
    }
  }
)

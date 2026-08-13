import { createFileRoute, redirect, isRedirect } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Users, Contact, Activity, TrendingUp, Loader2, AlertTriangle, CalendarCheck, BarChart3, UserX } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { StatCard } from "../../components/shared/StatCard"
import { WeeklySetoranChart } from "../../components/admin/WeeklySetoranChart"
import { getAdminDashboardStats, getAgregatSantriDashboard } from "../../server-fns/dashboard"
import { getAllRubrikTenant } from "../../server-fns/rubrik"
import { FormatPenilaian } from "../../components/FormatPenilaian"
import { AuthErrorAlert } from "../../components/AuthErrorAlert"
import { KATEGORI_COLORS } from "../../constants/kategori-colors"

export const Route = createFileRoute('/admin/')({
  component: Dashboard,
  loader: async () => {
    try {
      const [rubrikRes, agregatRes, statsRes] = await Promise.all([
        getAllRubrikTenant(),
        getAgregatSantriDashboard(),
        getAdminDashboardStats()
      ])
      return {
        rubrikAktif: rubrikRes,
        agregat: agregatRes.success ? agregatRes.data : null,
        statsData: statsRes.success ? statsRes.data : null,
        authError: null
      }
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return {
        rubrikAktif: [],
        agregat: null,
        statsData: null,
        authError: { message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' }
      }
    }
  },
  staleTime: 60 * 1000,
})

function Dashboard() {
  const { rubrikAktif, authError, agregat, statsData } = Route.useLoaderData()

  if (authError) return <AuthErrorAlert error={authError} />

  const stats = [
    {
      title: "Total Santri",
      value: statsData?.totalSantri || "0",
      icon: Users,
      description: "Santri aktif terdaftar",
    },
    {
      title: "Total Ustadz",
      value: statsData?.totalUstadz || "0",
      icon: Contact,
      description: "Muhaffizh pengajar",
    },
    {
      title: "Setoran Hari Ini",
      value: statsData?.totalSetoranHariIni || "0",
      icon: Activity,
      description: "Telah menyetor hafalan",
    },
    {
      title: "Status Sistem",
      value: "Aktif",
      icon: TrendingUp,
      description: "Semua sistem berjalan lancar",
    }
  ]

  const formatRelativeTime = (dateStr: string) => {
    const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
    const diffInMs = new Date(dateStr).getTime() - new Date().getTime()
    const diffInMins = Math.round(diffInMs / (1000 * 60))
    if (diffInMins > -60) return rtf.format(diffInMins, 'minute')
    const diffInHours = Math.round(diffInMins / 60)
    if (diffInHours > -24) return rtf.format(diffInHours, 'hour')
    return new Date(dateStr).toLocaleDateString('id-ID')
  }

  const isTrial = statsData?.tenantStatus === 'trial' && statsData?.trialEndsAt !== null
  const trialEnds = statsData?.trialEndsAt ? new Date(statsData.trialEndsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <div className="space-y-6 pb-24 font-sans">
      {isTrial && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900">Masa Trial (Percobaan)</h3>
            <p className="text-amber-800 text-sm mt-1">
              Lembaga Anda sedang dalam masa percobaan yang akan berakhir pada <b>{trialEnds}</b>.
              Silakan hubungi tim TahfidzKu untuk melakukan verifikasi dan aktivasi akun permanen.
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ahlan wa Sahlan, Administrator!</h2>
        <p className="text-slate-500 text-sm mt-1">Berikut adalah ringkasan aktivitas lembaga Anda hari ini.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            label={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
          />
        ))}
      </div>

      {agregat && (
        <div className="grid gap-3 sm:grid-cols-3">
          {/* TODO(product): Threshold tone (kapan warning/danger) sengaja belum ditentukan.
          // Perlu data riil beberapa lembaga dulu untuk kalibrasi angka yang masuk akal.
          // Lihat ticket Dashboard Revamp — keputusan Abdulloh 2026-08-03. */}
          {agregat.totalSesiAbsensi === 0 ? (
            <StatCard 
              label="Rata-rata Kehadiran" 
              value="—" 
              icon={CalendarCheck}
              description="Belum ada data absensi minggu ini" 
              tone="neutral" 
            />
          ) : (
            <StatCard 
              label="Rata-rata Kehadiran (7 Hari)" 
              value={`${agregat.rataKehadiranPersen}%`}
              icon={CalendarCheck} 
              description={`Total ${agregat.totalSantriAktif} santri aktif`} 
              tone="neutral"
            />
          )}

          <StatCard 
            label="Trend Halaman (7 Hari)" 
            value={agregat.trendHalaman.mingguIni}
            unit="hal"
            icon={BarChart3}
            tone="neutral"
            description={agregat.trendHalaman.selisih < 0 ? "Menurun dibanding minggu lalu" : "Total setoran halaman minggu ini"} 
          />

          <StatCard 
            label="Stagnan (Tanpa Setor 7 Hari)" 
            value={agregat.santriTanpaSetoran}
            unit="santri"
            badge={agregat.santriTanpaSetoran > 0 ? "Perlu Perhatian" : undefined}
            badgeVariant={agregat.santriTanpaSetoran > 0 ? "amber" : "slate"}
            icon={UserX} 
            tone={agregat.santriTanpaSetoran > 0 ? "warning" : "neutral"}
            description="Santri belum setor seminggu terakhir" 
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Grafik Setoran Mingguan</h3>
          <WeeklySetoranChart data={agregat?.setoranHarian || []} isLoading={!agregat} />
        </div>
        
        <div className="col-span-3 bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Setoran Terakhir</h3>
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2" style={{ maxHeight: '300px' }}>
            {statsData?.recentSetoran?.length === 0 ? (
              <p className="text-slate-500 text-sm italic text-center py-4">Belum ada setoran masuk.</p>
            ) : (
              statsData?.recentSetoran?.map((item: any, i: number) => {
                let infoTarget = ''
                const isIqra = item.tipe === 'iqra'
                if (isIqra) {
                  infoTarget = `Jilid ${item.jilid || ''} Hal ${item.halamanAwal || ''}`
                } else if (item.jenis === 'ziyadah') {
                  const surahName = item.surah || (item.surahMeta && item.surahMeta.length > 0 ? item.surahMeta[0].nama : 'Unknown')
                  infoTarget = `${surahName}: ${item.ayatAwal || ''}-${item.ayatAkhir || ''}`
                } else {
                  const juzVal = item.lintasJuz ? `${item.juzMulai}-${item.juzSelesai}` : (item.juzMulai || item.juz)
                  infoTarget = `Juz ${juzVal || ''} Hal ${item.halamanAwal || ''}-${item.halamanAkhir || ''}`
                }

                const catColor = isIqra 
                  ? 'bg-violet-100 text-violet-700' 
                  : (KATEGORI_COLORS[item.jenis as keyof typeof KATEGORI_COLORS] 
                      ? `${KATEGORI_COLORS[item.jenis as keyof typeof KATEGORI_COLORS].bg} ${KATEGORI_COLORS[item.jenis as keyof typeof KATEGORI_COLORS].text}` 
                      : 'bg-emerald-100 text-emerald-700')

                return (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{item.santriNama}</p>
                      <p className="text-xs text-slate-500 capitalize mt-0.5 group-hover:text-slate-600 transition-colors">
                        <span className={`px-1.5 py-0.5 rounded mr-1.5 font-semibold text-[10px] uppercase tracking-wider ${catColor}`}>{isIqra ? 'Iqra' : item.jenis}</span>
                        {infoTarget}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <FormatPenilaian item={item} />
                      <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(item.createdAt)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

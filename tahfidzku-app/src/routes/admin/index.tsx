import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Users, Contact, Activity, TrendingUp, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { getAdminDashboardStats } from "../../server-fns/dashboard"
import { getAllRubrikTenant } from "../../server-fns/rubrik"
import { FormatPenilaian } from "../../components/FormatPenilaian"

export const Route = createFileRoute('/admin/')({
  component: Dashboard,
  loader: async () => {
    const rubrikRes = await getAllRubrikTenant()
    return {
      rubrikAktif: rubrikRes
    }
  }
})

function Dashboard() {
  const { rubrikAktif } = Route.useLoaderData()
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  
  const [statsData, setStatsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await getAdminDashboardStats()
        if (res.success && res.data) {
          setStatsData(res.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-emerald-600 min-h-[50vh]">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  const stats = [
    {
      title: "Total Santri",
      value: statsData?.totalSantri || "0",
      icon: <Users className="h-6 w-6 text-emerald-600" />,
      description: "Santri aktif terdaftar",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100/50",
      textColor: "text-emerald-600",
    },
    {
      title: "Total Ustadz",
      value: statsData?.totalUstadz || "0",
      icon: <Contact className="h-6 w-6 text-blue-600" />,
      description: "Muhaffizh pengajar",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100/50",
      textColor: "text-blue-600",
    },
    {
      title: "Setoran Hari Ini",
      value: statsData?.totalSetoranHariIni || "0",
      icon: <Activity className="h-6 w-6 text-purple-600" />,
      description: "Telah menyetor hafalan",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100/50",
      textColor: "text-purple-600",
    },
    {
      title: "Status Sistem",
      value: "Aktif",
      icon: <TrendingUp className="h-6 w-6 text-amber-600" />,
      description: "Semua sistem berjalan lancar",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100/50",
      textColor: "text-amber-600",
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
    <div className="space-y-6 pb-24">
      {isTrial && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900">Masa Trial (Percobaan)</h3>
            <p className="text-amber-800 text-sm mt-1">
              Lembaga Anda sedang dalam masa percobaan yang akan berakhir pada <b>{trialEnds}</b>.
              Silakan hubungi tim TahfidzKu untuk melakukan verifikasi dan aktivasi akun permanen.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ahlan wa Sahlan, Administrator!</h2>
          <p className="text-slate-500 mt-1">Berikut adalah ringkasan aktivitas lembaga Anda hari ini.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm inline-flex w-fit">
          <p className="text-emerald-700 font-semibold text-sm">{today}</p>
        </div>
      </div>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${stat.textColor} tracking-wide uppercase opacity-80`}>{stat.title}</p>
                <h3 className={`text-3xl font-bold ${stat.textColor} mt-2 tracking-tight`}>{stat.value}</h3>
              </div>
              <div className={`p-3 ${stat.bgColor} rounded-xl border ${stat.borderColor}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Grafik Setoran Mingguan</h3>
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
            <p className="text-slate-400 font-medium">Pembaruan Data Grafik Segera Hadir</p>
            <p className="text-xs text-slate-400 mt-2 italic">*Catatan: Grafik aktivitas murojaah tercatat mulai Juli 2026.</p>
          </div>
        </div>
        
        <div className="col-span-3 bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Setoran Terakhir</h3>
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2" style={{ maxHeight: '300px' }}>
            {statsData?.recentSetoran?.length === 0 ? (
              <p className="text-slate-500 text-sm italic text-center py-4">Belum ada setoran masuk.</p>
            ) : (
              statsData?.recentSetoran?.map((item: any, i: number) => {
                let infoTarget = ''
                if (item.jenis === 'ziyadah') {
                  const surahName = item.surah || (item.surahMeta && item.surahMeta.length > 0 ? item.surahMeta[0].nama : 'Unknown')
                  infoTarget = `${surahName}: ${item.ayatAwal || ''}-${item.ayatAkhir || ''}`
                } else {
                  const juzVal = item.lintasJuz ? `${item.juzMulai}-${item.juzSelesai}` : (item.juzMulai || item.juz)
                  infoTarget = `Juz ${juzVal || ''} Hal ${item.halamanAwal || ''}-${item.halamanAkhir || ''}`
                }

                return (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{item.santriNama}</p>
                      <p className="text-xs text-slate-500 capitalize mt-0.5 group-hover:text-slate-600 transition-colors">{item.jenis} • {infoTarget}</p>
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

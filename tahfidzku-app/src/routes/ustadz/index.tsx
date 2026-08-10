import { createFileRoute, Link, redirect, isRedirect } from "@tanstack/react-router"
import { Card, CardContent } from "../../components/ui/card"
import { Edit } from "lucide-react"
import { getUstadzDashboard, getAgregatSantriDashboard } from "../../server-fns/dashboard"
import { getAllRubrikTenant } from "../../server-fns/rubrik"
import { FormatPenilaian } from "../../components/FormatPenilaian"
import { AuthErrorAlert } from "../../components/AuthErrorAlert"
import { Activity, Users, TrendingUp, TrendingDown } from "lucide-react"
import { formatDateWithHijri } from "../../lib/hijri-date"

export const Route = createFileRoute('/ustadz/')({
  component: UstadzDashboard,
  loader: async () => {
    try {
      const res = await getUstadzDashboard()
      const agregatRes = await getAgregatSantriDashboard()
      if (!res.success) {
        if (res.error?.code === 'UNAUTHENTICATED') throw redirect({ to: '/login' })
        return { data: null, agregat: null, rubrikAktif: null, authError: { message: res.error?.message, code: res.error?.code } }
      }
      const rubrikRes = await getAllRubrikTenant()
      return { 
        data: res.data, 
        agregat: agregatRes.success ? agregatRes.data : null,
        rubrikAktif: Array.isArray(rubrikRes) ? rubrikRes.filter((r: any) => r.aktif) : []
      }
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return { data: null, agregat: null, rubrikAktif: null, authError: { message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' } }
    }
  }
})

function UstadzDashboard() {
  const { data, agregat, authError } = Route.useLoaderData()
  
  if (authError) return <AuthErrorAlert error={authError} />
  if (!data) return null

  const today = formatDateWithHijri(new Date(), { includeWeekday: true })
  const persentase = data.totalSantri > 0 ? Math.round((data.totalSetoran / data.totalSantri) * 100) : 0

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-6">
      
      {/* Welcome Card & Date */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md">
        <p className="text-emerald-100 text-xs font-semibold mb-2">{today}</p>
        <h2 className="text-2xl font-bold mb-1">Ahlan, {data.namaUstadz}!</h2>
        <p className="text-emerald-50 text-sm mb-6 italic">"Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya." (HR. Bukhari)</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-emerald-50 text-xs font-medium">Santri Setor Hari Ini</p>
            <p className="text-2xl font-bold mt-1">{data.totalSetoran}<span className="text-sm font-normal text-emerald-100">/{data.totalSantri}</span></p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-emerald-50 text-xs font-medium">Target Selesai</p>
            <p className="text-2xl font-bold mt-1">{persentase}%</p>
          </div>
        </div>

        {agregat && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-emerald-50 text-xs font-medium flex items-center gap-1"><Activity className="w-3 h-3"/> Kehadiran 7 Hari</p>
              <p className="text-xl font-bold mt-1">{agregat.rataKehadiranPersen}%</p>
            </div>
            <div className={`rounded-xl p-3 backdrop-blur-sm ${agregat.santriTanpaSetoran > 0 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/10'}`}>
              <p className={`text-xs font-medium flex items-center gap-1 ${agregat.santriTanpaSetoran > 0 ? 'text-amber-100' : 'text-emerald-50'}`}><Users className="w-3 h-3"/> Tanpa Setor (7 Hari)</p>
              <p className={`text-xl font-bold mt-1 ${agregat.santriTanpaSetoran > 0 ? 'text-amber-100' : 'text-white'}`}>{agregat.santriTanpaSetoran} <span className={`text-sm font-normal ${agregat.santriTanpaSetoran > 0 ? 'text-amber-200/80' : 'text-emerald-100'}`}>santri</span></p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm col-span-2 flex justify-between items-center">
              <div>
                <p className="text-emerald-50 text-xs font-medium">Trend Halaman (7 Hari)</p>
                <p className="text-xl font-bold mt-1">{agregat.trendHalaman.mingguIni} <span className="text-sm font-normal text-emerald-100">hal</span></p>
              </div>
              {agregat.trendHalaman.selisih !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded ${agregat.trendHalaman.selisih > 0 ? 'bg-emerald-500/30 text-emerald-100' : 'bg-red-500/30 text-red-100'}`}>
                  {agregat.trendHalaman.selisih > 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                  {Math.abs(agregat.trendHalaman.selisih)}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-emerald-500/30">
          <Link to="/ustadz/analitik" className="flex items-center justify-between group">
            <span className="text-emerald-50 text-sm font-medium group-hover:text-white transition-colors">Lihat Analitik Agregat</span>
            <Activity className="w-4 h-4 text-emerald-200 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>

      {/* Belum Setor */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Belum Setor Hari Ini</h3>
          <Link to="/ustadz/pantau" className="text-emerald-600 text-xs font-bold hover:underline">Lihat Semua</Link>
        </div>
        <div className="space-y-3">
          {data.belumSetor.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">Semua santri sudah setor hari ini ??</p>
          ) : data.belumSetor.map((santri) => {
            const isIqra = santri.displayMode === 'iqra'
            const targetLabel = isIqra ? `Iqra Jilid ${santri.jilidIqraTerakhir || 1}` : `Target: Juz ${santri.targetJuz}`
            return (
              <div key={santri.id} className="group bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
                <div className="flex items-center justify-between p-3.5 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border uppercase ${isIqra ? 'bg-violet-100/80 text-violet-600 border-violet-200/60' : 'bg-slate-100/80 text-slate-600 border-slate-200/60'}`}>
                      {santri.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{santri.nama}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{targetLabel}</p>
                    </div>
                  </div>
                  <Link 
                    to="/ustadz/input"
                    className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-100 transition-colors border border-emerald-100"
                  >
                    Input
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Setoran Terbaru (Dengan Fitur Edit) */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Setoran Terbaru</h3>
        </div>
        <div className="space-y-3">
          {data.setoranTerbaru.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">Belum ada setoran masuk</p>
          ) : data.setoranTerbaru.map((s) => {
            const isIqra = s.tipe === 'iqra'
            return (
              <div key={s.id} className="group bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
                <div className="flex items-center justify-between p-3.5 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border uppercase ${isIqra ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      {s.santriNama?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{s.santriNama}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 mt-0.5">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${isIqra ? 'text-violet-700 bg-violet-50' : 'text-emerald-700 bg-emerald-50'}`}>
                          {isIqra ? 'Iqra' : (s as any).jenis}
                        </span>
                        <span>•</span>
                        <span>{isIqra ? `Jilid ${(s as any).jilid}` : (s as any).surah} ({isIqra ? 'Hal ' : ''}{isIqra && (s as any).halamanAwal === (s as any).halamanAkhir ? (s as any).halamanAwal : `${(s as any).halamanAwal ?? (s as any).ayatAwal}-${(s as any).halamanAkhir ?? (s as any).ayatAkhir}`})</span>
                      </div>
                      <FormatPenilaian item={s} />
                    </div>
                  </div>
                  <Link to="/ustadz/riwayat" className="flex items-center justify-center gap-1 bg-white text-slate-600 border border-slate-200 shadow-sm font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                    <Edit className="w-3 h-3" /> Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}

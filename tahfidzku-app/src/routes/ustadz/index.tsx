import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardContent } from "../../components/ui/card"
import { Edit } from "lucide-react"
import { getUstadzDashboard } from "../../server-fns/dashboard"
import { getAllRubrikTenant } from "../../server-fns/rubrik"
import { FormatPenilaian } from "../../components/FormatPenilaian"

export const Route = createFileRoute('/ustadz/')({
  component: UstadzDashboard,
  loader: async () => {
    const res = await getUstadzDashboard()
    if (!res.success) throw new Error(res.error?.message)
    const rubrikRes = await getAllRubrikTenant()
    return {
      data: res.data!,
      rubrikAktif: rubrikRes
    }
  }
})

function UstadzDashboard() {
  const { data, rubrikAktif } = Route.useLoaderData()
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const persentase = data.totalSantri > 0 ? Math.round((data.totalSetoran / data.totalSantri) * 100) : 0

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-6">
      
      {/* Welcome Card & Date */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md">
        <p className="text-emerald-100 text-xs font-semibold mb-2">{today}</p>
        <h2 className="text-2xl font-bold mb-1">Ahlan, Ustadz {data.namaUstadz}!</h2>
        <p className="text-emerald-50 text-sm mb-6 italic">"Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya." (HR. Bukhari)</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-emerald-50 text-xs font-medium">Santri Setor</p>
            <p className="text-2xl font-bold mt-1">{data.totalSetoran}<span className="text-sm font-normal text-emerald-100">/{data.totalSantri}</span></p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-emerald-50 text-xs font-medium">Target Selesai</p>
            <p className="text-2xl font-bold mt-1">{persentase}%</p>
          </div>
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
            <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">Semua santri sudah setor hari ini 🎉</p>
          ) : data.belumSetor.map((santri) => (
            <div key={santri.id} className="group bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
              <div className="flex items-center justify-between p-3.5 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-600 font-bold border border-slate-200/60 uppercase">
                    {santri.nama.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{santri.nama}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Target: Juz {santri.targetJuz}</p>
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
          ))}
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
          ) : data.setoranTerbaru.map((s) => (
            <div key={s.id} className="group bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
              <div className="flex items-center justify-between p-3.5 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold border border-emerald-100 uppercase">
                    {s.santriNama?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{s.santriNama}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 mt-0.5">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">{s.jenis}</span>
                      <span>•</span>
                      <span>{s.surah} ({s.ayatAwal}-{s.ayatAkhir})</span>
                    </div>
                    <FormatPenilaian item={s} />
                  </div>
                </div>
                <Link to="/ustadz/riwayat" className="flex items-center justify-center gap-1 bg-white text-slate-600 border border-slate-200 shadow-sm font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                  <Edit className="w-3 h-3" /> Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

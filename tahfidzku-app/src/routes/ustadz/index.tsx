import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent } from "../../components/ui/card"
import { Users, BookOpen, Clock, Edit } from "lucide-react"

export const Route = createFileRoute('/ustadz/')({
  component: UstadzDashboard,
})

function UstadzDashboard() {
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-6">
      
      {/* Welcome Card & Date */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md">
        <p className="text-emerald-100 text-xs font-semibold mb-2">{today}</p>
        <h2 className="text-2xl font-bold mb-1">Ahlan, Ustadz Ahmad!</h2>
        <p className="text-emerald-50 text-sm mb-6 italic">"Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya." (HR. Bukhari)</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-emerald-50 text-xs font-medium">Santri Setor</p>
            <p className="text-2xl font-bold mt-1">12<span className="text-sm font-normal text-emerald-100">/20</span></p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-emerald-50 text-xs font-medium">Target Selesai</p>
            <p className="text-2xl font-bold mt-1">60%</p>
          </div>
        </div>
      </div>

      {/* Quick Menu */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Menu Cepat</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Data Santri</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Jadwal</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Riwayat</span>
          </div>
        </div>
      </section>

      {/* Belum Setor */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Belum Setor Hari Ini</h3>
          <button className="text-emerald-600 text-xs font-bold">Lihat Semua</button>
        </div>
        <div className="space-y-3">
          {["Hasan Basri", "Umar Al-Faruq", "Ali bin Abi Thalib", "Usman Affan"].map((name, i) => (
            <Card key={i} className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 bg-white active:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{name}</p>
                      <p className="text-xs text-slate-500">Target: Al-Mulk (1-30)</p>
                    </div>
                  </div>
                  <button className="bg-emerald-50 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-100">
                    Input
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Setoran Terbaru (Dengan Fitur Edit) */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Setoran Terbaru</h3>
        </div>
        <div className="space-y-3">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold border border-emerald-200">
                    S
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Sulaiman</p>
                    <p className="text-xs text-slate-500">Ziyadah: Al-Mulk (1-10)</p>
                    <span className="text-[10px] font-bold text-emerald-600">Lancar</span>
                  </div>
                </div>
                <button className="flex items-center justify-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 transition-colors">
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  )
}

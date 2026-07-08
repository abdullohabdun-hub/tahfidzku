import { Users, UserSquare2, CheckCircle2, TrendingUp, Settings, Database, PlusCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"

export default function Dashboard() {
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  
  const stats = [
    {
      title: "Total Santri",
      value: "142",
      icon: <Users className="h-5 w-5 text-emerald-600" />,
      description: "Santri aktif bulan ini",
    },
    {
      title: "Total Ustadz",
      value: "12",
      icon: <UserSquare2 className="h-5 w-5 text-blue-600" />,
      description: "Muhaffizh terdaftar",
    },
    {
      title: "Setoran Hari Ini",
      value: "86",
      icon: <CheckCircle2 className="h-5 w-5 text-purple-600" />,
      description: "Telah menyetor hafalan",
    },
    {
      title: "Rata-rata Kelancaran",
      value: "85%",
      icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
      description: "Kualitas bacaan santri",
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ahlan wa Sahlan, Administrator!</h2>
          <p className="text-slate-500 mt-1">Berikut adalah ringkasan aktivitas lembaga Anda hari ini.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm inline-flex w-fit">
          <p className="text-emerald-700 font-semibold text-sm">{today}</p>
        </div>
      </div>

      {/* Quick Menu Widget */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors shadow-sm">
            <div className="w-10 h-10 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="font-semibold text-emerald-900 text-sm">Tambah Santri</span>
          </div>
          <div className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors shadow-sm">
            <div className="w-10 h-10 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center shrink-0">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <span className="font-semibold text-blue-900 text-sm">Kelola Ustadz</span>
          </div>
          <div className="bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors shadow-sm">
            <div className="w-10 h-10 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <span className="font-semibold text-amber-900 text-sm">Laporan Bulanan</span>
          </div>
          <div className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors shadow-sm">
            <div className="w-10 h-10 bg-slate-300 text-slate-700 rounded-full flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">Pengaturan Web</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className="p-2 bg-slate-50 rounded-md">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for Timeline/Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Grafik Setoran Mingguan</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center bg-slate-50 rounded-md m-6 mt-0 border border-slate-100 border-dashed">
            <p className="text-slate-400">Area Grafik (Chart.js / Recharts)</p>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Setoran Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Ahmad Fulan", surah: "Al-Mulk: 1-10", time: "10 menit yang lalu", status: "Lancar" },
                { name: "Budi Santoso", surah: "An-Naba: 1-40", time: "25 menit yang lalu", status: "Mengulang" },
                { name: "Siti Aminah", surah: "Al-Baqarah: 140-145", time: "1 jam yang lalu", status: "Lancar" },
                { name: "Zaid Abdullah", surah: "Yasin: 1-20", time: "2 jam yang lalu", status: "Terbata-bata" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.surah}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-medium mb-1
                      ${item.status === 'Lancar' ? 'bg-emerald-100 text-emerald-700' : 
                        item.status === 'Mengulang' ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'}
                    `}>
                      {item.status}
                    </span>
                    <p className="text-[10px] text-slate-400">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

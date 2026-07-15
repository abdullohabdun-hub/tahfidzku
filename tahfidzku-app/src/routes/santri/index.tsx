import { createFileRoute } from '@tanstack/react-router'
import { getSantriDashboardData } from '../../server-fns/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Flame, Target, BookOpen, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Button } from '../../components/ui/button'

export const Route = createFileRoute('/santri/')({
  component: SantriDashboard,
  loader: async () => {
    const res = await getSantriDashboardData()
    if (!res.success) throw new Error(res.error?.message || 'Gagal memuat data')
    return res.data
  }
})

function SantriDashboard() {
  const data = Route.useLoaderData()
  const profil = data?.profil
  const riwayat = data?.riwayat || []
  const progress = data?.progress

  const chartData = [
    { name: 'Selesai', value: progress?.juzSelesai || 0 },
    { name: 'Sisa', value: (progress?.targetJuz || 30) - (progress?.juzSelesai || 0) }
  ]
  const COLORS = ['#10b981', '#f1f5f9'] // Emerald for done, slate for remaining
  
  const murojaahChart = data?.murojaahChart || []

  return (
    <div className="space-y-6 pb-6">
      
      {/* Header Welcome */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Ahlan, {profil?.nama}! 👋</h1>
        <p className="text-sm text-slate-500 mt-0.5">Semoga istiqomah menjaga hafalan hari ini.</p>
      </div>

      {/* Streak Card */}
      <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base opacity-90 flex items-center gap-1.5">
            <Flame className="w-4 h-4" /> Weekly Streak
          </h3>
          <p className="text-2xl font-bold mt-1">{data?.streak} Hari</p>
          <p className="text-xs opacity-80 mt-1">Luar biasa! Pertahankan terus.</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Flame className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Progress Hafalan (Recharts) */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <Target className="w-4 h-4 text-emerald-600" /> Progres Hafalan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={45}
                    stroke="none"
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold text-slate-800">{progress?.percentage}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Target Hafalan</p>
                  <p className="font-bold text-slate-800">{progress?.targetJuz} Juz</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Telah Diselesaikan</p>
                  <p className="font-bold text-emerald-600">{progress?.juzSelesai} Juz</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grafik Murojaah */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <BookOpen className="w-4 h-4 text-emerald-600" /> Aktivitas Murojaah
          </CardTitle>
          <p className="text-xs text-slate-500 font-medium">Halaman yang dibaca dalam 7 hari terakhir</p>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={murojaahChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="halaman" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Riwayat Murojaah */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Riwayat Murojaah
          </h2>
          <Link to="/santri/input" className="text-sm text-emerald-600 font-medium hover:underline">
            Lapor Baru
          </Link>
        </div>

        {riwayat.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center border border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Belum ada riwayat Murojaah.</p>
            <Link to="/santri/input">
              <Button variant="outline" className="mt-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                Mulai Murojaah
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-slate-100"></div>
            
            <div className="space-y-6 relative">
              {riwayat.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 z-10 ring-4 ring-white">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-md">
                        {item.jenis}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.createdAt ? format(new Date(item.createdAt), 'd MMM yyyy, HH:mm', { locale: id }) : '-'}
                      </span>
                    </div>
                    {item.surah && <p className="font-semibold text-slate-800 text-sm">Surat {item.surah}</p>}
                    <p className="text-xs text-slate-500 mt-0.5">Juz {item.juz} • Hal {item.halamanAwal === item.halamanAkhir ? item.halamanAwal : `${item.halamanAwal}-${item.halamanAkhir}`} • {item.kualitas}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

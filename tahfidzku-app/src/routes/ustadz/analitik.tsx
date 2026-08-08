import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Activity, AlertTriangle, CheckCircle, TrendingUp, BookOpen, BarChart3 } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { getUstadzAnalitikData } from '../../server-fns/ustadz-analitik'
import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'

export const Route = createFileRoute('/ustadz/analitik')({
  component: UstadzAnalitikPage,
})

function UstadzAnalitikPage() {
  const [program, setProgram] = useState<'all' | 'tahfidz' | 'iqra'>('all')
  const fetchAnalitik = useServerFn(getUstadzAnalitikData)
  
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    fetchAnalitik({ data: { program } })
      .then(res => {
        if (mounted) setData(res)
      })
      .catch(err => {
        if (mounted) setData({ success: false })
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => { mounted = false }
  }, [program, fetchAnalitik])

  // Dynamic label based on the selected program filter
  const targetLabel = program === 'all' ? 'Progres Juz / Jilid' : program === 'iqra' ? 'Distribusi Jilid Iqra' : 'Distribusi Progres Juz'
  const metricLabel = program === 'iqra' ? 'Bacaan' : program === 'tahfidz' ? 'Hafalan' : 'Hafalan / Bacaan'

  if (isLoading && !data) {
    return <div className="p-4 text-center text-slate-500 text-sm mt-10">Memuat analitik...</div>
  }

  if (!data || !data.success) {
    return <div className="p-4">Gagal memuat data analitik.</div>
  }

  const analitik = data.data

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Analitik Santri</h1>
        <p className="text-slate-500 text-sm mt-1">Pantau progres seluruh santri binaan Anda</p>
      </div>

      {/* Program Filter */}
      <div className="flex gap-2">
        <button 
          onClick={() => setProgram('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${program === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Semua Program
        </button>
        <button 
          onClick={() => setProgram('tahfidz')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${program === 'tahfidz' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
        >
          Tahfidz
        </button>
        <button 
          onClick={() => setProgram('iqra')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${program === 'iqra' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'}`}
        >
          Iqra
        </button>
      </div>

      {/* Tren Kualitas Card */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Tren Kualitas {metricLabel} (Avg)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analitik.trenKualitas} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 5]} ticks={[1,2,3,4,5]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} Bintang`, 'Rata-rata']}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="avgKualitas" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribusi Progres Juz / Jilid */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            {targetLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analitik.distribusiJuz} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} width={60} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [value, 'Total Santri']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {analitik.distribusiJuz.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={program === 'iqra' ? '#06b6d4' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tren Halaman Total */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Tren Total Halaman
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analitik.trenHalaman} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} Halaman`, 'Total']}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="totalHalaman" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Santri At-Risk */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Perlu Perhatian (At-Risk)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analitik.isSemuaAktif ? (
             <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center mt-2">
               <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 mb-2">
                 <CheckCircle className="h-5 w-5 text-emerald-600" />
               </div>
               <p className="font-semibold text-emerald-800">Alhamdulillah, Semua Aktif!</p>
               <p className="text-sm text-emerald-600 mt-1">Tidak ada santri yang tertinggal setoran lebih dari 7 hari.</p>
             </div>
          ) : (
            <div className="space-y-3 mt-2">
              {analitik.atRisk.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{s.nama}</p>
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {s.hariTanpaSetor > 30 ? '> 30' : s.hariTanpaSetor} Hari Tanpa Setoran
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

import { createFileRoute, Link, redirect, isRedirect } from '@tanstack/react-router'
import { getSantriDashboard } from '../../server-fns/dashboard'
import { getAllRubrikTenant } from '../../server-fns/rubrik'
import { FormatPenilaian } from '../../components/FormatPenilaian'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Flame, Target, BookOpen, Clock, GraduationCap } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Button } from '../../components/ui/button'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'

export const Route = createFileRoute('/santri/')({
  component: SantriDashboard,
  loader: async () => {
    try {
      const res = await getSantriDashboard()
      if (!res.success) {
        if (res.error?.code === 'UNAUTHENTICATED') throw redirect({ to: '/login' })
        return { data: null, rubrikAktif: null, authError: { message: res.error?.message, code: res.error?.code } }
      }
      const rubrikRes = await getAllRubrikTenant()
      return {
        data: res.data!,
        rubrikAktif: rubrikRes,
        authError: null
      }
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return { data: null, rubrikAktif: null, authError: { message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' } }
    }
  }
})

function SantriDashboard() {
  const { data, authError } = Route.useLoaderData()

  if (authError) return <AuthErrorAlert error={authError} />
  if (!data) return null

  const displayMode = data.displayMode
  const profil = data.profil
  const riwayat = data.riwayat || []
  const progress = data.progress as any
  const analitikChart = data.analitikChart || []

  const isIqra = displayMode === 'iqra'
  
  const chartData = isIqra ? [
    { name: 'Selesai', value: progress?.jilidSekarang || 0 },
    { name: 'Sisa', value: Math.max(0, 6 - (progress?.jilidSekarang || 0)) }
  ] : [
    { name: 'Selesai', value: progress?.juzSelesai || 0 },
    { name: 'Sisa', value: (progress?.targetJuz || 30) - (progress?.juzSelesai || 0) }
  ]
  const COLORS = isIqra ? ['#8b5cf6', '#f1f5f9'] : ['#10b981', '#f1f5f9'] // Violet for Iqra, Emerald for Tahfidz
  const mainColorClass = isIqra ? 'text-violet-600' : 'text-emerald-600'
  const mainBgClass = isIqra ? 'bg-violet-600' : 'bg-emerald-600'
  const lightBgClass = isIqra ? 'bg-violet-100' : 'bg-emerald-100'
  const badgeColorClass = isIqra ? 'text-violet-600 bg-violet-100/50' : 'text-emerald-600 bg-emerald-100/50'

  return (
    <div className="space-y-6 pb-6">
      
      {/* Header Welcome */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Ahlan, {profil?.nama}! 👋</h1>
        <p className="text-sm text-slate-500 mt-0.5">Semoga istiqomah {isIqra ? 'belajar mengaji' : 'menjaga hafalan'} hari ini.</p>
      </div>

      {/* Streak Card */}
      <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base opacity-90 flex items-center gap-1.5">
            <Flame className="w-4 h-4" /> {data.streakMode === 'daily' ? 'Daily' : 'Weekly'} Streak
          </h3>
          <p className="text-2xl font-bold mt-1">{data.streak} {data.streakMode === 'daily' ? 'Hari' : 'Minggu'}</p>
          <p className="text-xs opacity-80 mt-1">
            {data.streakMode === 'daily' 
              ? 'Setor setiap hari untuk menjaga api!' 
              : 'Minimal 1x setor per minggu!'}
          </p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Flame className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Ujian Kenaikan Juz — tampil jika ada pending (hanya tahfidz) */}
      {profil?.juzUjianPending && !isIqra && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">
              ?? Ujian Kenaikan Juz {profil.juzUjianPending}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Hubungi ustadz Anda untuk menjadwalkan ujian sebelum bisa melanjutkan hafalan.
            </p>
          </div>
        </div>
      )}

      {/* Progress Hafalan (Recharts) */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <Target className={`w-4 h-4 ${mainColorClass}`} /> {isIqra ? 'Progres Jilid Iqra' : 'Progres Hafalan'}
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
                {isIqra ? (
                  <>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Jilid Saat Ini</p>
                      <p className={`font-bold ${mainColorClass}`}>Jilid {progress?.jilidSekarang}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Halaman Terakhir</p>
                      <p className="font-bold text-slate-800">Hal {progress?.halamanSekarang}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Target Hafalan</p>
                      <p className="font-bold text-slate-800">{progress?.targetJuz} Juz</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Telah Diselesaikan</p>
                      <p className={`font-bold ${mainColorClass}`}>{progress?.juzSelesai} Juz</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grafik Aktivitas Setoran / Murojaah */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <BookOpen className={`w-4 h-4 ${mainColorClass}`} /> {isIqra ? 'Aktivitas Setoran' : 'Aktivitas Murojaah'}
          </CardTitle>
          <p className="text-xs text-slate-500 font-medium">Halaman yang dibaca dalam 7 hari terakhir</p>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analitikChart}>
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
                <Bar dataKey="halaman" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Analitik Fase 4 (Hanya Tahfidz) */}
      {!isIqra && <DashboardAnalitikContainer santriId={profil.id} />}

      {/* Timeline Riwayat Setoran */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className={`w-4 h-4 ${mainColorClass}`} /> Setoran Terakhir
          </h2>
          <Link to="/santri/riwayat" className={`text-sm ${mainColorClass} font-medium hover:underline`}>
            Lihat Semua
          </Link>
        </div>

        {riwayat.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center border border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Belum ada riwayat setoran.</p>
            {!isIqra && (
              <Link to="/santri/input">
                <Button variant="outline" className={`mt-4 ${mainColorClass} border-emerald-200 hover:bg-emerald-50`}>
                  Mulai Murojaah
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-slate-100"></div>
            
            <div className="space-y-6 relative">
              {riwayat.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white ${lightBgClass} ${mainColorClass}`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className={`flex-1 bg-slate-50 hover:bg-white rounded-xl p-3.5 border border-slate-100 relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${isIqra ? 'hover:border-violet-100' : 'hover:border-emerald-100'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeColorClass}`}>
                        {isIqra ? 'Iqra' : item.jenis}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.createdAt ? format(new Date(item.createdAt), 'd MMM yyyy, HH:mm', { locale: id }) : '-'}
                      </span>
                    </div>
                    {isIqra ? (
                      <p className="font-semibold text-slate-800 text-sm mt-1">Jilid {item.jilid} (Hal {item.halamanAwal === item.halamanAkhir ? item.halamanAwal : `${item.halamanAwal}-${item.halamanAkhir}`})</p>
                    ) : (
                      <>
                        {item.surah && <p className="font-semibold text-slate-800 text-sm">{item.surah}</p>}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-slate-500">Juz {item.juz} • Hal {item.halamanAwal === item.halamanAkhir ? item.halamanAwal : `${item.halamanAwal}-${item.halamanAkhir}`} •</p>
                          <FormatPenilaian item={item} />
                        </div>
                      </>
                    )}
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

import { useEffect, useState } from 'react'
import { getGrafikDanSummarySantri } from '../../server-fns/grafik-santri'
import { getPetaKualitasJuz } from '../../server-fns/peta-juz'
import { getSantriAnalitik } from '../../server-fns/analitik'
import { EstimasiKhatam } from '../../components/dashboard/EstimasiKhatam'
import { PetaKualitasJuz } from '../../components/dashboard/PetaKualitasJuz'
import { GrafikAnalitikSantri } from '../../components/dashboard/GrafikAnalitikSantri'

function DashboardAnalitikContainer({ santriId }: { santriId: string }) {
  const [data, setData] = useState<{grafik?: any, peta?: any, estimasi?: any} | null>(null)
  const [errors, setErrors] = useState<{grafik?: any, peta?: any, estimasi?: any}>({})
  const [isLoading, setIsLoading] = useState(true)
  const [globalError, setGlobalError] = useState<{ message: string, code?: string } | null>(null)

  useEffect(() => {
    async function fetchAnalitik() {
      try {
        const payload = { data: { santriId } }
        const [resGrafik, resPeta, resAnalitik] = await Promise.allSettled([
          getGrafikDanSummarySantri(payload),
          getPetaKualitasJuz(payload),
          getSantriAnalitik(payload)
        ])
        
        setData({
          grafik: resGrafik.status === 'fulfilled' && resGrafik.value.success ? resGrafik.value.data : null,
          peta: resPeta.status === 'fulfilled' && resPeta.value.success ? resPeta.value.data?.peta : null,
          estimasi: resAnalitik.status === 'fulfilled' && resAnalitik.value.success ? resAnalitik.value.data?.estimasiKhatam : null
        })
        
        setErrors({
          grafik: resGrafik.status === 'rejected' ? { message: 'Koneksi terputus', code: 'NETWORK_ERROR' } : (!resGrafik.value.success ? resGrafik.value.error : null),
          peta: resPeta.status === 'rejected' ? { message: 'Koneksi terputus', code: 'NETWORK_ERROR' } : (!resPeta.value.success ? resPeta.value.error : null),
          estimasi: resAnalitik.status === 'rejected' ? { message: 'Koneksi terputus', code: 'NETWORK_ERROR' } : (!resAnalitik.value.success ? resAnalitik.value.error : null)
        })
      } catch (err: any) {
        setGlobalError({ message: 'Tidak dapat terhubung ke server', code: 'NETWORK_ERROR' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalitik()
  }, [santriId])

  return (
    <div className="space-y-6 mt-6">
      <EstimasiKhatam data={data?.estimasi} isLoading={isLoading} error={globalError || errors.estimasi} />
      <PetaKualitasJuz data={data?.peta} isLoading={isLoading} error={globalError || errors.peta} />
      <GrafikAnalitikSantri data={data?.grafik} isLoading={isLoading} error={globalError || errors.grafik} />
    </div>
  )
}

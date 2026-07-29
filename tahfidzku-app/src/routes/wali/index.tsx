import { useState } from "react"
import { createFileRoute, Link, redirect, isRedirect } from '@tanstack/react-router'
import { getWaliDashboard } from '../../server-fns/dashboard'
import { getAllRubrikTenant } from '../../server-fns/rubrik'
import { FormatPenilaian } from '../../components/FormatPenilaian'
import { Card, CardContent } from '../../components/ui/card'
import { Flame, Target, BookOpen, Clock, GraduationCap, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'

export const Route = createFileRoute('/wali/')({
  component: WaliDashboard,
  loader: async () => {
    try {
      const res = await getWaliDashboard()
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

function WaliDashboard() {
  const { data, authError } = Route.useLoaderData()

  if (authError) return <AuthErrorAlert error={authError} />
  if (!data) return null
  const { daftarAnak } = data
  const [activeIndex, setActiveIndex] = useState(0)

  if (!daftarAnak || daftarAnak.length === 0) {
    return <div className="p-4 text-center">Data anak tidak ditemukan</div>
  }

  const activeData = daftarAnak[activeIndex]
  if (!activeData) return null

  const isIqra = activeData.displayMode === 'iqra'
  const profil = activeData.profil

  const percentage = activeData.progress.percentage || 0
  const labelSelesai = isIqra ? activeData.progress.jilidSekarang : activeData.progress.juzSelesai
  const labelSelesaiSatuan = isIqra ? 'Jilid' : 'Juz'
  const labelTarget = isIqra ? 6 : (activeData.progress.targetJuz || 30)

  // SVG Circle calculation
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const riwayat = activeData.riwayat || []
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const getInisial = (nama: string) => {
    if (!nama) return '?'
    const parts = nama.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  const mainColorClass = isIqra ? 'text-violet-600' : 'text-emerald-600'
  const mainBgClass = isIqra ? 'bg-violet-600' : 'bg-emerald-600'
  const lightBgClass = isIqra ? 'bg-violet-100' : 'bg-emerald-100'
  const activeTabClass = isIqra ? 'bg-violet-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md'
  const inactiveTabClass = isIqra ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
  const circleColorClass = isIqra ? 'text-violet-500' : 'text-emerald-500'
  const iconColorClass = isIqra ? 'text-violet-700' : 'text-emerald-700'

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-6">

      {/* Tab Switcher Anak (Jika lebih dari 1) */}
      {daftarAnak.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {daftarAnak.map((anak: any, idx: number) => {
            const isChildIqra = anak.displayMode === 'iqra'
            return (
              <button
                key={anak.profil.id}
                onClick={() => setActiveIndex(idx)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  idx === activeIndex 
                    ? (isChildIqra ? 'bg-violet-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md')
                    : (isChildIqra ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200')
                }`}
              >
                {anak.profil.nama.split(' ')[0]}
              </button>
            )
          })}
        </div>
      )}

      {/* Date & Profil Anak */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${lightBgClass} ${iconColorClass} font-bold flex items-center justify-center text-lg border-2 border-white shadow-sm`}>
              {getInisial(profil.nama)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">{profil.nama}</h2>
              <p className="text-sm text-slate-500">{profil.namaKelas || 'Belum ada kelas'}</p>
            </div>
          </div>
          <p className={`${iconColorClass} text-[11px] font-bold pb-1`}>{today}</p>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-400/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base opacity-90 flex items-center gap-1.5">
              <Flame className="w-4 h-4 animate-pulse" /> {activeData.streakMode === 'daily' ? 'Daily' : 'Weekly'} Streak
            </h3>
            <p className="text-2xl font-bold mt-1">{activeData.streak} {activeData.streakMode === 'daily' ? 'Hari' : 'Minggu'}</p>
            <p className="text-xs opacity-90 mt-1 font-medium">
              {activeData.streakMode === 'daily' 
                ? 'Setor setiap hari untuk menjaga api!' 
                : 'Minimal 1x setor per minggu!'}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner">
            <Flame className="w-6 h-6 text-white animate-pulse" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Progress Card (Grafik Lingkaran) */}
      <Card className="border-slate-100 shadow-sm overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">

            {/* SVG Circular Progress */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Background Circle */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-100"
                />
                {/* Progress Circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`${circleColorClass} transition-all duration-1000 ease-out`}
                />
              </svg>
              {/* Text Inside Circle */}
              <div className="text-center absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{percentage}%</span>
                <span className="text-xs text-slate-500 font-medium">Selesai</span>
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="text-slate-600 text-sm">{isIqra ? 'Jilid Saat Ini:' : 'Total Hafalan Saat Ini:'}</p>
              <p className={`text-xl font-bold ${iconColorClass} mt-0.5`}>{labelSelesai} {labelSelesaiSatuan}</p>
              <p className="text-xs text-slate-400 mt-1">Target pencapaian: {labelTarget} {labelSelesaiSatuan}</p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Statistik Cepat */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-500 mb-1">Setoran Terakhir</p>
          <p className="text-sm font-bold text-slate-800 capitalize">
            {riwayat.length > 0 ? (isIqra ? `Jilid ${(riwayat[0] as any).jilid}` : ((riwayat[0] as any).surah || '-')) : '-'}
          </p>
          <p className="text-xs text-slate-400">{riwayat.length > 0 ? `Hal ${riwayat[0].halamanAwal}` : '-'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-slate-500 mb-2">Penilaian Terakhir</p>
          {riwayat.length > 0 ? (
            <FormatPenilaian item={riwayat[0]} />
          ) : (
            <p className="text-sm font-bold text-slate-400">-</p>
          )}
        </div>
      </div>

      {/* Lini Masa (Timeline) Riwayat */}
      <section className="pt-2">
        <h3 className="text-base font-bold text-slate-800 mb-4">Riwayat Setoran</h3>

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-[2px] before:bg-slate-200">

          {riwayat.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-4">Belum ada riwayat setoran.</div>
          ) : (
            riwayat.map((item: any) => {
              const date = new Date(item.createdAt)
              const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={item.id} className="relative flex items-start group">
                  {/* Icon / Bullet */}
                  <div className="flex flex-col items-center mt-1 w-8 shrink-0 relative z-10">
                    <div className={`w-3 h-3 rounded-full ${mainBgClass} border-2 border-white ring-4 ${isIqra ? 'ring-violet-50' : 'ring-emerald-50'}`} />
                  </div>

                  {/* Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex-1 ml-3">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {dateStr}, {timeStr}</span>
                      <FormatPenilaian item={item} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5 capitalize">
                      {isIqra ? 'Iqra' : item.jenis}: {isIqra ? `Jilid ${item.jilid}` : (item.surah || 'Surah')}
                    </h4>
                    <p className="text-slate-500 text-[11px]">Dinilai oleh: {item.ustadzNama}</p>
                  </div>
                </div>
              )
            })
          )}

        </div>
        <button className={`w-full mt-6 py-3 text-sm font-semibold ${mainColorClass} ${lightBgClass} rounded-xl hover:opacity-80 transition-colors`}>
          Lihat Semua Riwayat
        </button>
      </section>

    </div>
  )
}

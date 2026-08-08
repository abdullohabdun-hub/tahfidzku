import { useState, useEffect } from "react"
import { createFileRoute, Link, redirect, isRedirect } from '@tanstack/react-router'
import { getWaliDashboard } from '../../server-fns/dashboard'
import { getAllRubrikTenant } from '../../server-fns/rubrik'
import { FormatPenilaian } from '../../components/FormatPenilaian'
import { Card, CardContent } from '../../components/ui/card'
import { Flame, Target, BookOpen, Clock, GraduationCap, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'
import { getGrafikDanSummarySantri } from '../../server-fns/grafik-santri'
import { getPetaKualitasJuz } from '../../server-fns/peta-juz'
import { getSantriAnalitik } from '../../server-fns/analitik'
import { EstimasiKhatam } from '../../components/dashboard/EstimasiKhatam'
import { DistribusiKualitasJuzWali } from '../../components/dashboard/DistribusiKualitasJuzWali'
import { GrafikAnalitikSantri } from '../../components/dashboard/GrafikAnalitikSantri'

function DashboardAnalitikContainer({ santriId, displayMode }: { santriId: string, displayMode?: 'iqra' | 'tahfidz' }) {
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
    <div className="space-y-4 mt-4">
      {displayMode !== 'iqra' && <DistribusiKualitasJuzWali data={data?.peta} isLoading={isLoading} error={globalError || errors.peta} />}
      <GrafikAnalitikSantri 
        data={data?.grafik} 
        isLoading={isLoading} 
        error={globalError || errors.grafik} 
        hideRapor={true}
        hideDonut={displayMode !== 'iqra'}
      />
      <EstimasiKhatam 
        data={data?.estimasi} 
        isLoading={isLoading} 
        error={globalError || errors.estimasi} 
        displayMode={displayMode}
      />
    </div>
  )
}

export const Route = createFileRoute('/wali/progres')({
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
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-40 bg-slate-50 min-h-screen">
      {/* Header Statis */}
      <div className="flex items-center justify-center relative mb-4">
        <h1 className="text-lg font-bold text-slate-800">{isIqra ? 'Pemantauan Bacaan' : 'Pemantauan Hafalan'}</h1>
      </div>

      {/* Tab Switcher Anak */}
      {daftarAnak.length > 1 && (
        <div className="bg-white px-2 py-1 shadow-sm rounded-lg mb-4 flex gap-2 border-b border-slate-200 overflow-x-auto scrollbar-hide">
          {daftarAnak.map((anak: any, idx: number) => {
            const isChildIqra = anak.displayMode === 'iqra'
            return (
              <button
                key={anak.profil.id}
                onClick={() => setActiveIndex(idx)}
                className={`whitespace-nowrap px-4 py-2 text-sm transition-colors border-b-2 font-medium ${
                  idx === activeIndex 
                    ? (isChildIqra ? 'text-violet-600 border-violet-600 font-semibold' : 'text-emerald-600 border-emerald-600 font-semibold')
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                {anak.profil.nama.split(' ')[0]}
              </button>
            )
          })}
        </div>
      )}

      {/* Jika Belum Ada Data (Santri Baru) */}
      {riwayat.length === 0 ? (
        <div className="space-y-4 mt-2">
          <div className={`bg-gradient-to-r ${isIqra ? 'from-violet-50 to-violet-100 border-violet-200' : 'from-emerald-50 to-emerald-100 border-emerald-200'} rounded-xl p-4 border shadow-sm flex items-start gap-4`}>
            <div className="text-3xl">🎉</div>
            <div>
              <h3 className={`font-bold text-sm ${isIqra ? 'text-violet-800' : 'text-emerald-800'}`}>Ahlan wa Sahlan!</h3>
              <p className={`text-xs mt-1 ${isIqra ? 'text-violet-700' : 'text-emerald-700'}`}>
                Ananda {profil.nama.split(' ')[0]} belum memiliki riwayat setoran. Grafik dan analitik akan otomatis muncul di sini setelah ananda menyetorkan {isIqra ? 'halaman baru' : 'hafalannya'}.
              </p>
            </div>
          </div>
          
          <Card className="border-slate-100 shadow-sm opacity-50">
            <CardContent className="p-4">
              <div className="w-32 h-4 bg-slate-200 rounded mb-4"></div>
              <div className="w-full h-32 bg-slate-100 rounded flex items-center justify-center">
                <span className="text-xs text-slate-400 font-medium">Belum ada data (14 hari terakhir)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm opacity-50">
            <CardContent className="p-4">
              <div className="w-40 h-4 bg-slate-200 rounded mb-4"></div>
              <div className="w-full h-32 bg-slate-100 rounded flex items-center justify-center">
                <span className="text-xs text-slate-400 font-medium">Data kualitas belum tersedia</span>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-slate-100 rounded-xl p-5 border border-slate-200">
            <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Target Selesai</h2>
            <div className="text-3xl font-black mb-1 text-slate-300">Menunggu Data</div>
            <p className="text-slate-400 text-sm mt-2">Butuh minimal 3 sesi kunjungan untuk kalkulasi.</p>
          </div>
        </div>
      ) : (
        <DashboardAnalitikContainer santriId={profil.id} displayMode={isIqra ? 'iqra' : 'tahfidz'} />
      )}
    </div>
  )
}

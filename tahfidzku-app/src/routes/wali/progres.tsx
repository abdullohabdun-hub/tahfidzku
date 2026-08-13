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
import { SantriProfileView } from '../../components/shared/SantriProfileView'

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
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-40 bg-slate-50 min-h-screen">
      {/* Header Statis */}
      <div className="flex items-center justify-between relative mb-2">
        <h1 className="text-lg font-bold text-slate-800">{isIqra ? 'Pemantauan Bacaan Ananda' : 'Pemantauan Hafalan Ananda'}</h1>
      </div>

      {/* Tab Switcher Anak */}
      {daftarAnak.length > 1 && (
        <div className="bg-white px-3 py-1.5 shadow-xs rounded-xl mb-4 flex gap-2 border border-slate-200 overflow-x-auto scrollbar-hide">
          {daftarAnak.map((anak: any, idx: number) => {
            const isChildIqra = anak.displayMode === 'iqra'
            return (
              <button
                key={anak.profil.id}
                onClick={() => setActiveIndex(idx)}
                className={`whitespace-nowrap px-4 py-2 text-xs transition-colors rounded-lg font-semibold ${
                  idx === activeIndex 
                    ? (isChildIqra ? 'bg-violet-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs')
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {anak.profil.nama.split(' ')[0]}
              </button>
            )
          })}
        </div>
      )}

      {/* Shared Santri Profile & Indeks View */}
      <SantriProfileView santriId={profil.id} titlePrefix="Profil Ananda" />

      {/* Analitik & Grafik Tambahan Wali */}
      {riwayat.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-2">Grafik & Peta Analitik</h2>
          <DashboardAnalitikContainer santriId={profil.id} displayMode={isIqra ? 'iqra' : 'tahfidz'} />
        </div>
      )}
    </div>
  )
}

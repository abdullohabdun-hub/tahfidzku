import { createFileRoute, useRouter, redirect, isRedirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { LogOut, BookOpen, Award, User, Shield, CheckCircle2, ChevronRight, Loader2, BarChart2, RefreshCw } from 'lucide-react'
import { checkAuth, logout } from '../../server-fns/auth'
import { getSantriProfileDetail } from '../../server-fns/santri-profile'
import { getIndeksPerkembangan } from '../../server-fns/indeks-perkembangan'
import { getIndeksPerkembanganIqra } from '../../server-fns/indeks-perkembangan-iqra'
import { ChangePasswordForm } from '../../components/ChangePasswordForm'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'
import { surahByNomor } from '../../lib/quranMapper'

export const Route = createFileRoute('/santri/profil')({
  component: ProfilPage,
  loader: async () => {
    try {
      const user = await checkAuth()
      if (!user) throw redirect({ to: '/login' })

      // PENTING: gunakan hanya santriId (UUID ke tabel santri), JANGAN fallback ke user.id
      // user.id adalah akun ID — beda tabel, tidak bisa dipakai sebagai santri lookup key
      const targetId = user.santriId ?? null
      let detailData = null

      if (targetId) {
        const res = await getSantriProfileDetail({ data: { santriId: targetId } })
        if (res.success) {
          detailData = res.data
        }
      }

      return { user, targetId, detailData, authError: null }
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return { user: null, targetId: null, detailData: null, authError: { message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' } }
    }
  }
})

function ProfilPage() {
  const router = useRouter()
  const { user, targetId, detailData, authError } = Route.useLoaderData()

  const [periode, setPeriode] = useState<'bulanan' | 'semester_ganjil' | 'semester_genap' | 'tahunan'>('bulanan')
  const [indeksData, setIndeksData] = useState<any>(null)
  const [loadingIndeks, setLoadingIndeks] = useState(false)

  const santriInfo = detailData?.profil
  const isIqra = santriInfo?.tahapSantri === 'iqra'

  useEffect(() => {
    async function fetchIndeks() {
      if (!targetId || !santriInfo) return
      setLoadingIndeks(true)
      
      const res = isIqra
        ? await getIndeksPerkembanganIqra({ data: { santriId: targetId, periode } })
        : await getIndeksPerkembangan({ data: { santriId: targetId, periode } })
        
      if (res.success) {
        setIndeksData(res.data)
      }
      setLoadingIndeks(false)
    }
    fetchIndeks()
  }, [targetId, periode, isIqra, santriInfo])

  if (authError) return <AuthErrorAlert error={authError} />
  if (!user) return null

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      router.invalidate()
      router.navigate({ to: '/login' })
    }
  }

  const initial = user?.nama ? user.nama.substring(0, 2).toUpperCase() : "SA"
  const nama = user?.nama || "Santri"

  let posLabel = 'Belum ada setoran'
  if (isIqra) {
    if (santriInfo?.jilidIqraTerakhir) {
      posLabel = `Jilid ${santriInfo.jilidIqraTerakhir}${santriInfo.halamanIqraTerakhir ? `, Hal. ${santriInfo.halamanIqraTerakhir}` : ''}`
    }
  } else {
    if (santriInfo?.posisiTerakhir && santriInfo.posisiTerakhir.surahNomor && santriInfo.posisiTerakhir.ayat) {
      const sName = surahByNomor[santriInfo.posisiTerakhir.surahNomor]?.nama || `Surah ${santriInfo.posisiTerakhir.surahNomor}`
      posLabel = `${sName} : Ayat ${santriInfo.posisiTerakhir.ayat}`
    }
  }

  const lastSabqi = detailData?.lastMurojaah?.lastSabqi
  const lastManzil = detailData?.lastMurojaah?.lastManzil

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-24 h-24 bg-primary/15 text-primary rounded-full flex items-center justify-center font-extrabold text-3xl mb-3 border-4 border-white shadow-md uppercase">
          {initial}
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{nama}</h2>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${isIqra ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {isIqra ? 'Santri Iqra' : 'Santri Tahfidz'}
          </span>
          {detailData?.kelasNama && (
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {detailData.kelasNama}
            </span>
          )}
        </div>
      </div>

      {/* Grid Status Capaian & Murojaah Terakhir */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Posisi Ziyadah / Hafalan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" />
            Posisi Hafalan Ziyadah
          </p>
          <p className="text-base font-bold text-slate-900">{posLabel}</p>
        </div>

        {/* Target Hafalan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-primary" />
            Target Hafalan
          </p>
          <p className="text-base font-bold text-slate-900">
            {isIqra ? 'Tuntas Iqra 6' : `${santriInfo?.targetJuz || 30} Juz`}
          </p>
        </div>

        {!isIqra && (
          <>
            {/* Murojaah Sabqi Terakhir */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-cyan-600" />
                Murojaah Sabqi Terakhir
              </p>
              {lastSabqi ? (
                <p className="text-sm font-bold text-cyan-800">
                  Juz {lastSabqi.juz || lastSabqi.juzMulai}
                  {lastSabqi.halamanAwal ? `, Hal. ${lastSabqi.halamanAwal}${lastSabqi.halamanAkhir && lastSabqi.halamanAkhir !== lastSabqi.halamanAwal ? `-${lastSabqi.halamanAkhir}` : ''}` : ''}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada setoran Sabqi</p>
              )}
            </div>

            {/* Murojaah Manzil Terakhir */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-violet-600" />
                Murojaah Manzil Terakhir
              </p>
              {lastManzil ? (
                <p className="text-sm font-bold text-violet-800">
                  Juz {lastManzil.juz || lastManzil.juzMulai}
                  {lastManzil.halamanAwal ? `, Hal. ${lastManzil.halamanAwal}${lastManzil.halamanAkhir && lastManzil.halamanAkhir !== lastManzil.halamanAwal ? `-${lastManzil.halamanAkhir}` : ''}` : ''}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada setoran Manzil</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Indeks Perkembangan & Performa */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Indeks Perkembangan</h3>
              <p className="text-xs text-slate-500">Metrik statistik hafalan dan kedisiplinan Anda</p>
            </div>
          </div>
          <select
            value={periode}
            onChange={(e: any) => setPeriode(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="bulanan">Bulanan</option>
            <option value="semester_ganjil">Semester Ganjil</option>
            <option value="semester_genap">Semester Genap</option>
            <option value="tahunan">Tahunan</option>
          </select>
        </div>

        {loadingIndeks ? (
          <div className="p-8 text-center flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !indeksData ? (
          <p className="text-sm text-slate-400 italic text-center py-6">Data indeks perkembangan belum tersedia</p>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Setoran</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{indeksData.totalSetoran || 0}</p>
              </div>
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Kelancaran</p>
                <p className="text-xl font-bold text-emerald-800 mt-0.5">{indeksData.skorKelancaran || '-'}</p>
              </div>
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl col-span-2 sm:col-span-1">
                <p className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">Kedisiplinan</p>
                <p className="text-xl font-bold text-blue-800 mt-0.5">{indeksData.skorKedisiplinan || '-'}</p>
              </div>
            </div>

            {indeksData.catatanEvaluasi && (
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1">
                <p className="text-xs font-bold text-amber-800">Catatan Evaluasi Pengampu</p>
                <p className="text-xs text-amber-900/90 leading-relaxed">{indeksData.catatanEvaluasi}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ubah Password */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Keamanan Akun
        </h3>
        <ChangePasswordForm role="santri" />
      </div>

      {/* Tombol Logout */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-bold text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Aplikasi</span>
        </button>
      </div>
    </div>
  )
}


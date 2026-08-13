import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { getSantriProfileDetail } from '../../server-fns/santri-profile'
import { SURAH_LIST, cariJuzUntukAyat, formatSetoranKeSurahAyat } from '../../lib/quranMapper'
import { getIndeksPerkembangan } from '../../server-fns/indeks-perkembangan'
import { getIndeksPerkembanganIqra } from '../../server-fns/indeks-perkembangan-iqra'
import { PageHeader } from './PageHeader'
import { Loader2, AlertCircle, Info, ChevronLeft, ShieldAlert, LogOut } from 'lucide-react'
import { Button } from '../ui/button'

export interface SantriProfileViewProps {
  santriId: string
  backUrl?: string
  showLogoutButton?: boolean
  onLogout?: () => void
  readOnly?: boolean
  titlePrefix?: string
}

export function SantriProfileView({
  santriId,
  backUrl,
  showLogoutButton = false,
  onLogout,
  titlePrefix = 'Profil Santri',
}: SantriProfileViewProps) {
  const [santriData, setSantriData] = useState<any>(null)
  const [loadingSantri, setLoadingSantri] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [periode, setPeriode] = useState<'bulanan' | 'semester_ganjil' | 'semester_genap' | 'tahunan'>('bulanan')
  const [indeksData, setIndeksData] = useState<any>(null)
  const [loadingIndeks, setLoadingIndeks] = useState(true)

  useEffect(() => {
    async function fetchSantri() {
      if (!santriId) return
      setLoadingSantri(true)
      setErrorMsg(null)
      try {
        const res = await getSantriProfileDetail({ data: { santriId } })
        if (res.success) {
          setSantriData(res.data)
        } else {
          setErrorMsg(res.error?.message || 'Santri tidak ditemukan atau Anda tidak memiliki akses.')
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Santri tidak ditemukan atau Anda tidak memiliki akses.')
      } finally {
        setLoadingSantri(false)
      }
    }
    fetchSantri()
  }, [santriId])

  useEffect(() => {
    async function fetchIndeks() {
      if (!santriData || !santriId) return
      setLoadingIndeks(true)
      const isIqra = santriData.profil?.tahapSantri === 'iqra'
      
      try {
        const res = isIqra
          ? await getIndeksPerkembanganIqra({ data: { santriId, periode } })
          : await getIndeksPerkembangan({ data: { santriId, periode } })
          
        if (res.success) {
          setIndeksData(res.data)
        } else {
          setIndeksData(null)
        }
      } catch (err) {
        setIndeksData(null)
      } finally {
        setLoadingIndeks(false)
      }
    }
    fetchIndeks()
  }, [santriId, periode, santriData])

  if (loadingSantri) {
    return (
      <div className="p-8 text-center flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (errorMsg || !santriData) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Akses Dibatasi</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {errorMsg || 'Santri tidak ditemukan atau Anda tidak memiliki akses ke profil santri ini.'}
        </p>
        {backUrl && (
          <div className="pt-2">
            <Link to={backUrl}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                Kembali
              </Button>
            </Link>
          </div>
        )}
      </div>
    )
  }

  const profil = santriData.profil
  const isIqra = profil?.tahapSantri === 'iqra'
  const lastSabqi = santriData.lastMurojaah?.lastSabqi
  const lastManzil = santriData.lastMurojaah?.lastManzil

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          {backUrl && (
            <Link to={backUrl}>
              <Button variant="ghost" size="icon" className="text-slate-500 rounded-full hover:bg-slate-100">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <PageHeader 
            title={`${titlePrefix}: ${profil?.nama || 'Santri'}`} 
            description="Detail informasi, capaian hafalan, dan indeks perkembangan santri" 
          />
        </div>

        {showLogoutButton && onLogout && (
          <Button 
            onClick={onLogout} 
            variant="outline" 
            size="sm" 
            className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 shrink-0"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Info Santri & Progres Hafalan */}
        <div className="space-y-6">
          {/* Informasi Dasar */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Informasi Dasar</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Nama Lengkap</p>
                <p className="text-sm font-semibold text-slate-900">{profil?.nama}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kelas / Halaqoh</p>
                <p className="text-sm font-medium text-slate-700">{santriData.kelasNama || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tipe Kelas</p>
                <p className="text-sm font-medium text-slate-700 capitalize">{santriData.tipeKelas?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tahap Pembelajaran</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isIqra ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isIqra ? 'Iqra' : 'Tahfidz'}
                </span>
              </div>
            </div>
          </div>

          {/* Progres & Capaian Hafalan */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Progres & Capaian Hafalan</h3>
            <div className="space-y-3">
              {isIqra ? (
                <>
                  <div>
                    <p className="text-xs text-slate-500">Jilid Saat Ini</p>
                    <p className="text-sm font-semibold text-slate-900">{profil.jilidIqraTerakhir != null ? `Jilid ${profil.jilidIqraTerakhir}` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Halaman Terakhir</p>
                    <p className="text-sm font-semibold text-slate-900">{profil.halamanIqraTerakhir != null ? `Hal. ${profil.halamanIqraTerakhir}` : '-'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-slate-500">Target Hafalan</p>
                    <p className="text-sm font-semibold text-slate-800">Juz {profil?.targetJuz || 30}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Juz Selesai (Tuntas)</p>
                    <p className="text-sm font-bold text-emerald-700">{`${profil?.juzProgress?.length || 0} Juz`}</p>
                  </div>
                  {(profil?.juzProgress?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs text-slate-500">Daftar Juz Tuntas</p>
                      <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {profil?.juzProgress?.slice().sort((a: number, b: number) => a - b).join(', ')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Posisi Hafalan Ziyadah</p>
                    <p className="text-sm font-bold text-emerald-800">
                      {profil?.posisiTerakhir
                        ? `Juz ${cariJuzUntukAyat(profil.posisiTerakhir.surahNomor, profil.posisiTerakhir.ayat)} — ${SURAH_LIST.find(s => s.nomor === profil.posisiTerakhir.surahNomor)?.nama || '-'}: Ayat ${profil.posisiTerakhir.ayat}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Murojaah Sabqi Terakhir</p>
                    {lastSabqi ? (
                      <p className="text-sm font-bold text-cyan-800">
                        {formatSetoranKeSurahAyat(lastSabqi)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Belum ada setoran Sabqi</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Murojaah Manzil Terakhir</p>
                    {lastManzil ? (
                      <p className="text-sm font-bold text-violet-800">
                        {formatSetoranKeSurahAyat(lastManzil)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Belum ada setoran Manzil</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Indeks Perkembangan Full Card */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-slate-900">Indeks Perkembangan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Skor komposit berdasarkan performa setoran</p>
            </div>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-medium text-slate-700"
            >
              <option value="bulanan">Bulan Ini</option>
              <option value="semester_ganjil">Semester Ganjil</option>
              <option value="semester_genap">Semester Genap</option>
              <option value="tahunan">Tahun Ajaran</option>
            </select>
          </div>

          {loadingIndeks ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : !indeksData ? (
            <div className="text-center text-sm text-slate-500 py-10 border border-dashed rounded-lg">
              Data indeks perkembangan belum tersedia
            </div>
          ) : (
            <div className="space-y-8">
              {/* Score Gauge Circle */}
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0 relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-100 bg-emerald-50 text-emerald-700 shadow-xs">
                  <span className="text-3xl font-bold tracking-tight">{indeksData.skor}</span>
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="46" 
                      fill="transparent" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      strokeDasharray={`${indeksData.skor * 2.89} 289`} 
                      className="text-emerald-500 transition-all duration-1000 ease-out" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-slate-800">Skor Keseluruhan</h4>
                  <p className="text-sm font-medium text-slate-600 mt-0.5">
                    {indeksData.skor >= 80 ? 'Sangat Baik' : indeksData.skor >= 65 ? 'Baik' : indeksData.skor >= 50 ? 'Cukup' : 'Perlu Perhatian'}
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    {indeksData.isIqra 
                      ? 'Mode Iqra' 
                      : `Mode ${indeksData.isMukim ? 'Mukim (Reguler)' : 'Non-Mukim'}`}
                  </p>
                </div>
              </div>

              {/* Warning Banners */}
              {indeksData.flags?.noTargetHariSetoran && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Target Hari Setoran Belum Diset.</strong> Komponen Konsistensi Setoran tidak dapat dihitung dengan akurat karena admin belum mengatur target bulanan untuk kelas ini.
                  </div>
                </div>
              )}

              {indeksData.flags?.noTargetSelfReport && (
                <div className="bg-slate-50 border border-slate-200 text-slate-700 text-xs p-3 rounded-lg flex gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Komponen Kemandirian Dikecualikan.</strong> Admin belum mengatur target laporan mandiri bulanan untuk kelas ini. Bobot 15% diredistribusi proporsional ke komponen 1–4.
                  </div>
                </div>
              )}

              {/* Breakdown Komponen Progress Rows */}
              <div className="space-y-5 border-t border-slate-100 pt-5">
                <h4 className="font-medium text-sm text-slate-700">Breakdown Komponen</h4>
                
                {/* 1. Kualitas */}
                <ProgressRow 
                  label="Kualitas Bacaan" 
                  skor={indeksData.breakdown.kualitas.skor} 
                  bobot={indeksData.breakdown.kualitas.bobot} 
                  colorClass="bg-blue-500" 
                />

                {/* 2. Konsistensi */}
                <ProgressRow 
                  label="Konsistensi Setoran" 
                  skor={indeksData.breakdown.konsistensi.skor} 
                  bobot={indeksData.breakdown.konsistensi.bobot} 
                  colorClass="bg-purple-500" 
                />

                {indeksData.isIqra ? (
                  <>
                    {/* 3. Progres Halaman (Iqra) */}
                    <ProgressRow 
                      label="Progres Halaman" 
                      skor={indeksData.breakdown.progres.skor} 
                      bobot={indeksData.breakdown.progres.bobot} 
                      colorClass="bg-emerald-500"
                      coldStart={indeksData.breakdown.progres.coldStart} 
                    />

                    {/* 4. Kelancaran (Iqra) */}
                    <ProgressRow 
                      label="Kelancaran" 
                      skor={indeksData.breakdown.kelancaran.skor} 
                      bobot={indeksData.breakdown.kelancaran.bobot} 
                      colorClass="bg-amber-500" 
                    />
                  </>
                ) : (
                  <>
                    {/* 3. Ziyadah (Tahfidz) */}
                    <ProgressRow 
                      label="Progres Ziyadah" 
                      skor={indeksData.breakdown.ziyadah.skor} 
                      bobot={indeksData.breakdown.ziyadah.bobot} 
                      colorClass="bg-emerald-500"
                      coldStart={indeksData.breakdown.ziyadah.coldStart} 
                    />

                    {/* 4. Murojaah (Tahfidz) */}
                    <ProgressRow 
                      label="Kepatuhan Murojaah" 
                      skor={indeksData.breakdown.murojaah.skor} 
                      bobot={indeksData.breakdown.murojaah.bobot} 
                      colorClass="bg-amber-500" 
                      coldStart={indeksData.breakdown.murojaah.coldStart} 
                    />

                    {/* 5. Kemandirian (Non-Mukim Tahfidz) */}
                    {indeksData.breakdown.kemandirian && (
                      <ProgressRow 
                        label="Kemandirian (Self-Report)" 
                        skor={indeksData.breakdown.kemandirian.skor} 
                        bobot={indeksData.breakdown.kemandirian.bobot} 
                        colorClass="bg-rose-500" 
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProgressRow({ label, skor, bobot, colorClass, coldStart }: { label: string, skor: number, bobot: number, colorClass: string, coldStart?: boolean }) {
  const displaySkor = Math.round(skor)
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end">
        <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          {label}
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {Math.round(bobot * 100)}%
          </span>
        </span>
        <span className="text-sm font-semibold text-slate-900">{displaySkor}/100</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`} 
          style={{ width: `${Math.min(100, Math.max(0, skor))}%` }}
        />
      </div>
      {coldStart && (
        <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-1 font-medium">
          <Info className="w-3 h-3" />
          <span>Data historis belum cukup ({'<'} 3 bulan). Diberikan nilai default netral 50.</span>
        </div>
      )}
    </div>
  )
}

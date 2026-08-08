import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { getSantriProfileDetail } from '../../../server-fns/santri-profile'
import { SURAH_LIST, cariJuzUntukAyat } from '../../../lib/quranMapper'
import { getIndeksPerkembangan } from '../../../server-fns/indeks-perkembangan'
import { getIndeksPerkembanganIqra } from '../../../server-fns/indeks-perkembangan-iqra'
import { PageHeader } from '../../../components/shared/PageHeader'
import { Loader2, AlertCircle, Info, ChevronLeft } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/santri/$santriId')({
  component: SantriDetailProfile,
})



function SantriDetailProfile() {
  const { santriId } = Route.useParams()
  const [santriData, setSantriData] = useState<any>(null)
  const [loadingSantri, setLoadingSantri] = useState(true)

  const [periode, setPeriode] = useState<'bulanan' | 'semester_ganjil' | 'semester_genap' | 'tahunan'>('bulanan')
  const [indeksData, setIndeksData] = useState<any>(null)
  const [loadingIndeks, setLoadingIndeks] = useState(true)

  useEffect(() => {
    async function fetchSantri() {
      setLoadingSantri(true)
      const res = await getSantriProfileDetail({ data: { santriId } })
      if (res.success) {
        setSantriData(res.data)
      }
      setLoadingSantri(false)
    }
    fetchSantri()
  }, [santriId])

  useEffect(() => {
    async function fetchIndeks() {
      if (!santriData) return // Wait until santriData is loaded to know the tahap
      
      setLoadingIndeks(true)
      const isIqra = santriData.profil?.tahapSantri === 'iqra'
      
      const res = isIqra
        ? await getIndeksPerkembanganIqra({ data: { santriId, periode } })
        : await getIndeksPerkembangan({ data: { santriId, periode } })
        
      if (res.success) {
        setIndeksData(res.data)
      }
      setLoadingIndeks(false)
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

  if (!santriData) {
    return (
      <div className="p-8 text-center text-slate-500">
        Santri tidak ditemukan
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/admin/santri">
          <Button variant="ghost" size="icon" className="text-slate-500 rounded-full hover:bg-slate-100">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <PageHeader 
          title={`Profil Santri: ${santriData.profil?.nama}`} 
          description="Detail informasi dan metrik perkembangan santri" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri */}
        <div className="space-y-6">
          {/* Info Santri (Kiri) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Informasi Dasar</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Nama Lengkap</p>
                <p className="text-sm font-medium text-slate-900">{santriData.profil?.nama}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kelas / Halaqoh</p>
                <p className="text-sm font-medium text-slate-900">{santriData.kelasNama || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tipe Kelas</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{santriData.tipeKelas?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tahap Santri</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{santriData.profil?.tahapSantri || 'Tahfidz'}</p>
              </div>
            </div>
          </div>

          {/* Progres Hafalan */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Progres Hafalan</h3>
            <div className="space-y-3">
              {santriData.profil?.tahapSantri === 'iqra' ? (
                <>
                  <div>
                    <p className="text-xs text-slate-500">Jilid Saat Ini</p>
                    <p className="text-sm font-medium text-slate-900">{santriData.profil.jilidIqraTerakhir != null ? `Jilid ${santriData.profil.jilidIqraTerakhir}` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Halaman Terakhir</p>
                    <p className="text-sm font-medium text-slate-900">{santriData.profil.halamanIqraTerakhir != null ? `Hal. ${santriData.profil.halamanIqraTerakhir}` : '-'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-slate-500">Juz Selesai (Tuntas)</p>
                    <p className="text-sm font-medium text-slate-900">{`${santriData.profil?.juzProgress?.length || 0} Juz`}</p>
                  </div>
                  {(santriData.profil?.juzProgress?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs text-slate-500">Daftar Juz</p>
                      <p className="text-sm font-medium text-slate-900">{santriData.profil?.juzProgress?.slice().sort((a: number, b: number) => a - b).join(', ')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Sedang Dihafal</p>
                    <p className="text-sm font-medium text-slate-900">
                      {santriData.profil?.posisiTerakhir
                        ? `Juz ${cariJuzUntukAyat(santriData.profil.posisiTerakhir.surahNomor, santriData.profil.posisiTerakhir.ayat)} — ${SURAH_LIST.find(s => s.nomor === santriData.profil!.posisiTerakhir!.surahNomor)?.nama || '-'}, Ayat ${santriData.profil.posisiTerakhir.ayat}`
                        : '-'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Indeks Perkembangan (Kanan, 2 kolom) */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Indeks Perkembangan</h3>
              <p className="text-xs text-slate-500 mt-1">Skor komposit berdasarkan performa setoran</p>
            </div>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-medium"
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
              Data indeks tidak tersedia
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0 relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm">
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
                  <p className="text-sm text-slate-500 mt-1">
                    {indeksData.skor >= 80 ? 'Sangat Baik' : indeksData.skor >= 65 ? 'Baik' : indeksData.skor >= 50 ? 'Cukup' : 'Perlu Perhatian'}
                  </p>
                  <p className="text-xs text-indigo-600 font-medium mt-1">
                    {indeksData.isIqra 
                      ? 'Mode Iqra' 
                      : `Mode ${indeksData.isMukim ? 'Mukim (Reguler)' : 'Non-Mukim'}`}
                  </p>
                </div>
              </div>

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
            {(bobot * 100)}%
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

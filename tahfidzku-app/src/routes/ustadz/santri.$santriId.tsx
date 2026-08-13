import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { getSantriProfileDetail } from '../../server-fns/santri-profile'
import { SURAH_LIST, cariJuzUntukAyat } from '../../lib/quranMapper'
import { getIndeksPerkembangan } from '../../server-fns/indeks-perkembangan'
import { getIndeksPerkembanganIqra } from '../../server-fns/indeks-perkembangan-iqra'
import { PageHeader } from '../../components/shared/PageHeader'
import { Loader2, AlertCircle, ChevronLeft, ShieldAlert, BookOpen } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/ustadz/santri/$santriId')({
  component: UstadzSantriProfile,
})

function UstadzSantriProfile() {
  const { santriId } = Route.useParams()
  const [santriData, setSantriData] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loadingSantri, setLoadingSantri] = useState(true)

  const [periode, setPeriode] = useState<'bulanan' | 'semester_ganjil' | 'semester_genap' | 'tahunan'>('bulanan')
  const [indeksData, setIndeksData] = useState<any>(null)
  const [loadingIndeks, setLoadingIndeks] = useState(true)

  useEffect(() => {
    async function fetchSantri() {
      setLoadingSantri(true)
      setErrorMsg(null)
      try {
        const res = await getSantriProfileDetail({ data: { santriId } })
        if (res.success) {
          setSantriData(res.data)
        } else {
          setErrorMsg(res.error.message || 'Santri tidak ditemukan atau Anda tidak memiliki akses.')
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
      if (!santriData) return
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

  // 403 / 404 Access Denied Guard View
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
        <div className="pt-2">
          <Link to="/ustadz">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isIqra = santriData.profil?.tahapSantri === 'iqra'

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/ustadz">
          <Button variant="ghost" size="icon" className="text-slate-500 rounded-full hover:bg-slate-100">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <PageHeader 
          title={`Profil Santri: ${santriData.profil?.nama}`} 
          description="Detail informasi dan metrik perkembangan santri (Read-Only)" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri — Informasi Dasar & Progres */}
        <div className="space-y-6">
          {/* Info Santri */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Informasi Dasar</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Nama Lengkap</p>
                <p className="text-sm font-semibold text-slate-900">{santriData.profil?.nama}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kelas / Halaqoh</p>
                <p className="text-sm font-medium text-slate-700">{santriData.kelasNama || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tipe Kelas</p>
                <p className="text-sm font-medium text-slate-700 capitalize">{santriData.tipeKelas || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tahap Pembelajaran</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isIqra ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isIqra ? 'Iqra' : 'Tahfidz'}
                </span>
              </div>
            </div>
          </div>

          {/* Posisi Terakhir / Progres */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Posisi Capaian Terakhir</h3>
            {isIqra ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Jilid & Halaman</p>
                <p className="text-base font-bold text-violet-700">
                  {santriData.profil?.jilidIqraTerakhir 
                    ? `Jilid ${santriData.profil.jilidIqraTerakhir}${santriData.profil.halamanIqraTerakhir ? `, Hal. ${santriData.profil.halamanIqraTerakhir}` : ''}`
                    : 'Belum ada data'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Target Juz</p>
                  <p className="text-sm font-semibold text-slate-800">Juz {santriData.profil?.targetJuz || 30}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Posisi Hafalan Ziyadah</p>
                  {santriData.profil?.posisiTerakhir ? (
                    <p className="text-base font-bold text-emerald-700">
                      {SURAH_LIST.find(s => s.nomor === santriData.profil.posisiTerakhir.surahNomor)?.nama || `Surah ${santriData.profil.posisiTerakhir.surahNomor}`} : Ayat {santriData.profil.posisiTerakhir.ayat}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Belum ada setoran Ziyadah</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-500">Murojaah Sabqi Terakhir</p>
                  {santriData.lastMurojaah?.lastSabqi ? (
                    <p className="text-sm font-bold text-cyan-800">
                      Juz {santriData.lastMurojaah.lastSabqi.juz || santriData.lastMurojaah.lastSabqi.juzMulai}
                      {santriData.lastMurojaah.lastSabqi.halamanAwal ? `, Hal. ${santriData.lastMurojaah.lastSabqi.halamanAwal}${santriData.lastMurojaah.lastSabqi.halamanAkhir && santriData.lastMurojaah.lastSabqi.halamanAkhir !== santriData.lastMurojaah.lastSabqi.halamanAwal ? `-${santriData.lastMurojaah.lastSabqi.halamanAkhir}` : ''}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada setoran Sabqi</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-500">Murojaah Manzil Terakhir</p>
                  {santriData.lastMurojaah?.lastManzil ? (
                    <p className="text-sm font-bold text-violet-800">
                      Juz {santriData.lastMurojaah.lastManzil.juz || santriData.lastMurojaah.lastManzil.juzMulai}
                      {santriData.lastMurojaah.lastManzil.halamanAwal ? `, Hal. ${santriData.lastMurojaah.lastManzil.halamanAwal}${santriData.lastMurojaah.lastManzil.halamanAkhir && santriData.lastMurojaah.lastManzil.halamanAkhir !== santriData.lastMurojaah.lastManzil.halamanAwal ? `-${santriData.lastMurojaah.lastManzil.halamanAkhir}` : ''}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada setoran Manzil</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan — Indeks Perkembangan */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900">Indeks Perkembangan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Rekapitulasi metrik performa hafalan santri</p>
              </div>
              <select
                value={periode}
                onChange={(e: any) => setPeriode(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="bulanan">Bulanan</option>
                <option value="semester_ganjil">Semester Ganjil</option>
                <option value="semester_genap">Semester Genap</option>
                <option value="tahunan">Tahunan</option>
              </select>
            </div>

            {loadingIndeks ? (
              <div className="p-8 text-center flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : !indeksData ? (
              <p className="text-sm text-slate-400 italic text-center py-6">Data indeks perkembangan belum tersedia</p>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Setoran</p>
                    <p className="text-lg font-bold text-slate-800">{indeksData.totalSetoran || 0}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-[10px] text-emerald-700 uppercase font-semibold">Kelancaran</p>
                    <p className="text-lg font-bold text-emerald-800">{indeksData.skorKelancaran || '-'}</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-blue-700 uppercase font-semibold">Kedisiplinan</p>
                    <p className="text-lg font-bold text-blue-800">{indeksData.skorKedisiplinan || '-'}</p>
                  </div>
                </div>

                {indeksData.catatanEvaluasi && (
                  <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-amber-800">Catatan Evaluasi</p>
                    <p className="text-xs text-amber-900/90 leading-relaxed">{indeksData.catatanEvaluasi}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { createFileRoute, useRouter, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { getRiwayatSetoranSantri, updateSetoranSantri } from '../../server-fns/setoran'
import { getRiwayatIqraSantriSelf } from '../../server-fns/setoran-iqra'
import { getSantriProfile } from '../../server-fns/santri'
import { Loader2, History, Calendar, Edit2, BookOpen, ChevronDown, ChevronUp, FileText, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import { FormatPenilaian } from '../../components/FormatPenilaian'
import { EditSetoranModal } from '../../components/EditSetoranModal'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'
import { getSantriDisplayMode } from '../../lib/santri-display'
import { parseDateString } from '../../lib/dateUtils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'

import { getGrafikDanSummarySantri } from '../../server-fns/grafik-santri'
import { getPetaKualitasJuz } from '../../server-fns/peta-juz'
import { getSantriAnalitik } from '../../server-fns/analitik'
import { EstimasiKhatam } from '../../components/dashboard/EstimasiKhatam'
import { PetaKualitasJuz } from '../../components/dashboard/PetaKualitasJuz'
import { GrafikAnalitikSantri } from '../../components/dashboard/GrafikAnalitikSantri'
import { KATEGORI_COLORS } from '../../constants/kategori-colors'

export const Route = createFileRoute('/santri/riwayat')({
  component: SantriRiwayatSetoran,
})

const KUALITAS_MAP = {
  lancar: { label: 'Lancar', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  mengulang: { label: 'Mengulang', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  terbata: { label: 'Terbata', color: 'text-red-700 bg-red-50 border-red-200' },
}

const JENIS_MAP = {
  ziyadah: { label: 'Ziyadah', color: `${KATEGORI_COLORS.ziyadah.bg} ${KATEGORI_COLORS.ziyadah.text}` },
  sabqi: { label: 'Sabqi', color: `${KATEGORI_COLORS.sabqi.bg} ${KATEGORI_COLORS.sabqi.text}` },
  manzil: { label: 'Manzil', color: `${KATEGORI_COLORS.manzil.bg} ${KATEGORI_COLORS.manzil.text}` },
}

function SantriRiwayatSetoran() {
  const router = useRouter()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<{ message: string, code?: string } | null>(null)
  
  const [dataTahfidz, setDataTahfidz] = useState<any[]>([])
  const [dataIqra, setDataIqra] = useState<any[]>([])
  const [displayMode, setDisplayMode] = useState<'iqra' | 'tahfidz'>('tahfidz')
  const [santriId, setSantriId] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [showArsip, setShowArsip] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedSetoran, setSelectedSetoran] = useState<any>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      
      const profileRes = await getSantriProfile()
      if (!profileRes.success) {
        if (profileRes.error?.code === 'UNAUTHENTICATED') {
          navigate({ to: '/login' })
          return
        }
        setAuthError({ message: profileRes.error?.message || 'Akses ditolak', code: profileRes.error?.code })
        return
      }
      
      if (profileRes.data) {
        setDisplayMode(getSantriDisplayMode(profileRes.data))
        setSantriId(profileRes.data.id)
      }

      const resTahfidz = await getRiwayatSetoranSantri()
      const resIqra = await getRiwayatIqraSantriSelf()
      
      if (resTahfidz.success) {
        setDataTahfidz(resTahfidz.data)
      }
      if (resIqra.success) {
        setDataIqra(resIqra.data)
      }
      
    } catch (err: any) {
      setAuthError({ message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleEdit = (item: any) => {
    setSelectedSetoran(item)
    setEditModalOpen(true)
  }

  const handleSave = async (payload: any) => {
    const res = await updateSetoranSantri({ data: payload })
    if (res.success) {
      await loadData()
      router.invalidate()
    }
    return res
  }

  if (authError) {
    return <AuthErrorAlert error={authError} />
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  const renderTahfidz = (items: any[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">Belum ada riwayat Tahfidz</p>
        </div>
      )
    }
    return items.map((item) => {
      const jm = JENIS_MAP[item.jenis as keyof typeof JENIS_MAP]
      const isSelfReport = item.sumber === 'santri_self_report'

      return (
        <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 right-0 flex">
            <div className={`text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-widest ${jm?.color || 'bg-slate-100 text-slate-800'}`}>
              {jm?.label || item.jenis}
            </div>
            {isSelfReport ? (
              <div className="bg-orange-100 text-orange-800 text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">
                MANDIRI
              </div>
            ) : (
              <div className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">
                USTADZ
              </div>
            )}
          </div>

          <div className="flex items-start justify-between mt-2">
            <div>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                 <Calendar className="w-3.5 h-3.5" />
                 {format(parseDateString(item.tanggalSetoran), 'dd MMM yyyy', { locale: id })}
              </p>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                {item.surahMeta?.label || (item.surah ? `${item.surah} ${item.ayatAwal}-${item.ayatAkhir}` : `Juz ${item.lintasJuz ? `${item.juzMulai}-${item.juzSelesai}` : (item.juzMulai || item.juz)}`)}
              </h3>
            </div>
            <FormatPenilaian item={item} />
          </div>

          {item.catatan && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan</p>
              {item.catatan}
            </div>
          )}

          {isSelfReport && item.ditinjauOlehUstadz && item.responUstadz && (
            item.responUstadz.tipe === 'ditinjau' ? (
              <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg w-fit text-blue-700 text-xs font-medium">
                <span className="font-bold">✓</span>
                Sudah Dipantau Ustadz
                {item.responUstadz.diresponPada && (
                  <span className="opacity-60 ml-1">
                    ({format(new Date(item.responUstadz.diresponPada), 'dd MMM HH:mm', { locale: id })})
                  </span>
                )}
              </div>
            ) : (
              <div className={`rounded-lg p-3 text-sm border ${
                item.responUstadz.tipe === 'disetujui' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                item.responUstadz.tipe === 'perlu_perbaikan' ? 'bg-red-50 border-red-100 text-red-800' :
                'bg-blue-50 border-blue-100 text-blue-800'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-bold uppercase opacity-70">
                    Tanggapan Ustadz ({item.responUstadz.tipe.replace('_', ' ')})
                  </p>
                  {item.responUstadz.diresponPada && (
                    <p className="text-[9px] opacity-60">
                      {format(new Date(item.responUstadz.diresponPada), 'dd MMM HH:mm', { locale: id })}
                    </p>
                  )}
                </div>
                {item.responUstadz.catatan && (
                  <p className="italic font-medium">{item.responUstadz.catatan}</p>
                )}
              </div>
            )
          )}


          <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[11px]">
             <div className="flex flex-col">
               <span className="text-slate-400">
                 {isSelfReport ? 'Dilaporkan Mandiri Kepada:' : 'Disimak Oleh:'}
               </span>
               <span className="font-medium text-slate-700">
                 {isSelfReport && (!item.ustadzNama || item.ustadzNama === 'Tanpa Ustadz') ? 'Sistem' : item.ustadzNama}
               </span>
             </div>

             {isSelfReport && !item.ditinjauOlehUstadz && (
               <button 
                 onClick={() => handleEdit(item)}
                 className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
               >
                 <Edit2 className="w-3.5 h-3.5" /> Edit
               </button>
             )}
             
             {isSelfReport && item.ditinjauOlehUstadz && (
               <span className="text-xs font-semibold text-slate-400">Telah ditinjau</span>
             )}
          </div>
        </div>
      )
    })
  }

  const renderIqra = (items: any[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-slate-500 font-medium">Belum ada riwayat Iqra</p>
        </div>
      )
    }
    return items.map((item) => {
      const isUjian = item.type === 'ujian'
      const data = item.data

      return (
        <div key={`${item.type}-${data.id}`} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 right-0 flex">
            {isUjian ? (
              <div className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">
                UJIAN
              </div>
            ) : (
              <div className="bg-violet-100 text-violet-800 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">
                SETORAN
              </div>
            )}
          </div>

          <div className="flex items-start justify-between mt-2">
            <div>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                 <Calendar className="w-3.5 h-3.5" />
                 {format(parseDateString(item.date), 'dd MMM yyyy', { locale: id })}
              </p>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                Jilid {data.jilid}
                {!isUjian && data.halamanAwal && (
                  <span className="font-normal text-slate-600">, Hal. {data.halamanAwal}{data.halamanAkhir && data.halamanAkhir !== data.halamanAwal ? `-${data.halamanAkhir}` : ''}</span>
                )}
              </h3>
            </div>
            
            {/* Kualitas Iqra */}
            {data.skorKualitas && (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-50 border border-violet-200">
                <span className="font-bold text-violet-700">{data.skorKualitas}</span>
              </div>
            )}
          </div>

          {isUjian && (
            <div className={`text-xs font-bold px-2 py-1.5 rounded inline-block self-start ${data.lulus ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {data.lulus ? 'LULUS UJIAN' : 'TIDAK LULUS'}
            </div>
          )}

          {data.catatan && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan</p>
              {data.catatan}
            </div>
          )}

          <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[11px]">
             <div className="flex flex-col">
               <span className="text-slate-400">
                 {isUjian ? 'Diuji Oleh:' : 'Disimak Oleh:'}
               </span>
               <span className="font-medium text-slate-700">
                 {item.ustadzNama || '-'}
               </span>
             </div>
          </div>
        </div>
      )
    })
  }

  const mainData = displayMode === 'iqra' ? dataIqra : dataTahfidz;
  const arsipData = displayMode === 'iqra' ? dataTahfidz : dataIqra;
  const arsipLabel = displayMode === 'iqra' ? 'Riwayat Tahfidz' : 'Arsip Iqra';

  return (
    <div className="pb-8 max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3 bg-white p-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="bg-emerald-100 p-2 rounded-lg">
          <History className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Riwayat Belajar</h1>
          <p className="text-xs text-slate-500">Program {displayMode === 'iqra' ? 'Iqra' : 'Tahfidz'}</p>
        </div>
      </div>

      <div className="px-4">
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100/50">
            <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">Timeline Setoran</TabsTrigger>
            <TabsTrigger value="analitik" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">Statistik & Analitik</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="space-y-4">
            {/* Utama */}
            <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              {displayMode === 'iqra' ? 'Riwayat Iqra' : 'Riwayat Tahfidz'}
            </h2>
          </div>
          {displayMode === 'iqra' ? renderIqra(mainData) : renderTahfidz(mainData)}
        </div>

        {/* Arsip (Jika ada) */}
        {arsipData.length > 0 && (
          <div className="mt-8">
            <button 
              onClick={() => setShowArsip(!showArsip)}
              className="w-full flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                {arsipLabel}
              </div>
              {showArsip ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {showArsip && (
              <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 opacity-0 fade-in duration-300 fill-mode-forwards">
                {displayMode === 'iqra' ? renderTahfidz(arsipData) : renderIqra(arsipData)}
              </div>
            )}
          </div>
        )}
          </TabsContent>

          <TabsContent value="analitik">
            {santriId ? (
              <DashboardAnalitikContainer santriId={santriId} displayMode={displayMode} />
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Data santri tidak ditemukan.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EditSetoranModal 
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedSetoran(null)
        }}
        initialData={selectedSetoran}
        onSave={handleSave}
        isUstadz={false}
      />
    </div>
  )
}

function DashboardAnalitikContainer({ santriId, displayMode }: { santriId: string, displayMode: 'tahfidz' | 'iqra' }) {
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
    <div className="space-y-6">
      {displayMode === 'tahfidz' && (
        <>
          <EstimasiKhatam data={data?.estimasi} isLoading={isLoading} error={globalError || errors.estimasi} />
          <PetaKualitasJuz data={data?.peta} isLoading={isLoading} error={globalError || errors.peta} />
        </>
      )}
      <GrafikAnalitikSantri data={data?.grafik} isLoading={isLoading} error={globalError || errors.grafik} />
    </div>
  )
}

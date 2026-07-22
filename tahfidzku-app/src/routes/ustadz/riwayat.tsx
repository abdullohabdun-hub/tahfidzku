import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { getSetoranRiwayat, updateSetoran } from '../../server-fns/setoran'
import { Loader2, History, AlertCircle, Calendar, User, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { EditSetoranModal } from '../../components/EditSetoranModal'
import { getKelasYangDiampu, getRiwayatAbsensiKelas } from '../../server-fns/absensi'
import { getAllRubrikTenant } from '../../server-fns/rubrik'
import { FormatPenilaian } from '../../components/FormatPenilaian'

export const Route = createFileRoute('/ustadz/riwayat')({
  component: UstadzRiwayatSetoran,
})



const JENIS_MAP = {
  ziyadah: { label: 'Ziyadah', color: 'bg-purple-100 text-purple-800' },
  sabqi: { label: 'Sabqi', color: 'bg-blue-100 text-blue-800' },
  manzil: { label: 'Manzil', color: 'bg-indigo-100 text-indigo-800' },
}

function UstadzRiwayatSetoran() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'setoran' | 'absensi'>('setoran')
  
  // State Setoran
  const [data, setData] = useState<any[]>([])
  const [rubrikAktif, setRubrikAktif] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedSetoran, setSelectedSetoran] = useState<any>(null)

  // State Absensi
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [riwayatAbsensi, setRiwayatAbsensi] = useState<any[]>([])
  const [loadingAbsensi, setLoadingAbsensi] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getSetoranRiwayat()
      const rubrikRes = await getAllRubrikTenant()
      if (res.success) {
        setData(res.data)
        setRubrikAktif(rubrikRes)
      } else {
        setErrorMsg(res.error?.message || 'Gagal memuat riwayat')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const loadKelas = async () => {
    const res = await getKelasYangDiampu()
    if (res.success && res.data) {
      setKelasList(res.data)
      if (res.data.length > 0) setSelectedKelasId(res.data[0].id)
    }
  }

  useEffect(() => {
    loadData()
    loadKelas()
  }, [])

  useEffect(() => {
    if (activeTab === 'absensi' && selectedKelasId) {
      loadRiwayatAbsensi()
    }
  }, [activeTab, selectedKelasId])

  const loadRiwayatAbsensi = async () => {
    setLoadingAbsensi(true)
    const res = await getRiwayatAbsensiKelas({ data: { kelasId: selectedKelasId } })
    if (res.success && res.data) {
      setRiwayatAbsensi(res.data.riwayat)
    }
    setLoadingAbsensi(false)
  }

  const handleEdit = (item: any) => {
    setSelectedSetoran(item)
    setEditModalOpen(true)
  }

  const handleSave = async (payload: any) => {
    const res = await updateSetoran({ data: payload })
    if (res.success) {
      await loadData()
      router.invalidate()
    }
    return res
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="pb-8 max-w-xl mx-auto space-y-4">
      <div className="bg-white sticky top-0 z-20 border-b border-slate-200 shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <History className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Riwayat Aktivitas</h1>
            <p className="text-xs text-slate-500">Catatan kelas & santri Anda</p>
          </div>
        </div>
        
        <div className="flex border-t border-slate-100 px-2">
          <button 
            onClick={() => setActiveTab('setoran')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'setoran' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Setoran Hafalan
          </button>
          <button 
            onClick={() => setActiveTab('absensi')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'absensi' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Absensi Sesi
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {activeTab === 'setoran' && (
          <>
            {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        {data.length === 0 && !errorMsg ? (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Belum ada riwayat setoran</p>
            <p className="text-xs text-slate-400 mt-1">Setoran dari santri Anda akan muncul di sini.</p>
          </div>
        ) : (
          data.map((item) => {
             const jm = JENIS_MAP[item.jenis as keyof typeof JENIS_MAP]
             const isSelfReport = item.sumber === 'santri_self_report'

             return (
               <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden flex flex-col gap-3">
                 
                 {/* Badges Bar (Atas Kanan) */}
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
                        {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                     </p>
                     <h3 className="font-bold text-slate-800 text-base leading-tight">
                       {item.surahMeta?.label || (item.surah ? `${item.surah} ${item.ayatAwal}-${item.ayatAkhir}` : `Juz ${item.lintasJuz ? `${item.juzMulai}-${item.juzSelesai}` : (item.juzMulai || item.juz)}`)}
                     </h3>
                   </div>
                   
                   <FormatPenilaian item={item} rubrikAktif={rubrikAktif} />
                 </div>

                 {item.catatan && (
                   <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan</p>
                     {item.catatan}
                   </div>
                 )}

                 <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{item.santriNama}</span>
                    </div>
                    
                    {!isSelfReport && (
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                 </div>
               </div>
             )
          })
          )}
          </>
        )}

        {activeTab === 'absensi' && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600 shrink-0">Kelas:</label>
              <select 
                value={selectedKelasId} 
                onChange={e => setSelectedKelasId(e.target.value)} 
                className="w-full bg-slate-50 border-none rounded p-1 text-sm outline-none ring-0"
              >
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>

            {loadingAbsensi ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
            ) : riwayatAbsensi.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Belum ada riwayat absensi</p>
                <p className="text-xs text-slate-400 mt-1">Absensi sesi kelas akan muncul di sini.</p>
              </div>
            ) : (
              riwayatAbsensi.map(sesi => (
                <div key={sesi.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      {format(new Date(sesi.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })}
                    </div>
                    <span className="text-xs text-slate-500">{format(new Date(sesi.createdAt), 'HH:mm')}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-sm">
                    <div className="bg-emerald-50 rounded p-2 border border-emerald-100">
                      <div className="text-lg font-bold text-emerald-700">{sesi.summary.hadir}</div>
                      <div className="text-[10px] uppercase font-bold text-emerald-600">Hadir</div>
                    </div>
                    <div className="bg-blue-50 rounded p-2 border border-blue-100">
                      <div className="text-lg font-bold text-blue-700">{sesi.summary.izin}</div>
                      <div className="text-[10px] uppercase font-bold text-blue-600">Izin</div>
                    </div>
                    <div className="bg-yellow-50 rounded p-2 border border-yellow-100">
                      <div className="text-lg font-bold text-yellow-700">{sesi.summary.sakit}</div>
                      <div className="text-[10px] uppercase font-bold text-yellow-600">Sakit</div>
                    </div>
                    <div className="bg-red-50 rounded p-2 border border-red-100">
                      <div className="text-lg font-bold text-red-700">{sesi.summary.alpa}</div>
                      <div className="text-[10px] uppercase font-bold text-red-600">Alpa</div>
                    </div>
                    <div className="bg-orange-50 rounded p-2 border border-orange-100 col-span-2 md:col-span-1">
                      <div className="text-lg font-bold text-orange-700">{sesi.summary.terlambat}</div>
                      <div className="text-[10px] uppercase font-bold text-orange-600">Terlambat</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 text-right mt-1">Total: {sesi.summary.total} santri tercatat</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <EditSetoranModal 
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedSetoran(null)
        }}
        initialData={selectedSetoran}
        onSave={handleSave}
        isUstadz={true}
      />
    </div>
  )
}

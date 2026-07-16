import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { getRiwayatSetoranSantri, updateSetoranSantri } from '../../server-fns/setoran'
import { Loader2, History, AlertCircle, Calendar, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { EditSetoranModal } from '../../components/EditSetoranModal'

export const Route = createFileRoute('/santri/riwayat')({
  component: SantriRiwayatSetoran,
})

const KUALITAS_MAP = {
  lancar: { label: 'Lancar', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  mengulang: { label: 'Mengulang', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  terbata: { label: 'Terbata', color: 'text-red-700 bg-red-50 border-red-200' },
}

const JENIS_MAP = {
  ziyadah: { label: 'Ziyadah', color: 'bg-purple-100 text-purple-800' },
  sabqi: { label: 'Sabqi', color: 'bg-blue-100 text-blue-800' },
  manzil: { label: 'Manzil', color: 'bg-indigo-100 text-indigo-800' },
}

function SantriRiwayatSetoran() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedSetoran, setSelectedSetoran] = useState<any>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getRiwayatSetoranSantri()
      if (res.success) {
        setData(res.data)
      } else {
        setErrorMsg(res.error?.message || 'Gagal memuat riwayat')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="pb-8 max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3 bg-white p-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="bg-emerald-100 p-2 rounded-lg">
          <History className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Riwayat Hafalan</h1>
          <p className="text-xs text-slate-500">Menampilkan 50 setoran terakhir</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
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
            <p className="text-xs text-slate-400 mt-1">Setoranmu akan muncul di sini.</p>
          </div>
        ) : (
          data.map((item) => {
             const km = item.kualitas ? KUALITAS_MAP[item.kualitas as keyof typeof KUALITAS_MAP] : null
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
                       {item.surahMeta?.label || (item.surah ? `${item.surah} ${item.ayatAwal}-${item.ayatAkhir}` : `Juz ${item.juz}`)}
                     </h3>
                   </div>
                   
                   {/* Kualitas - Hanya tampil jika ada dan diisi */}
                   {km && (
                     <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${km.color} shrink-0 ml-3`}>
                       {km.label}
                     </div>
                   )}
                 </div>

                 {item.catatan && (
                   <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan</p>
                     {item.catatan}
                   </div>
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

                    {isSelfReport && (
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

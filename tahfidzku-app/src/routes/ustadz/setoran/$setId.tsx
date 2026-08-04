import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { getSetoranDetailUstadz, submitFeedbackSetoran } from '../../../server-fns/setoran'
import { useState, useEffect } from 'react'
import { Check, X, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export const Route = createFileRoute('/ustadz/setoran/$setId')({
  component: SetoranDetailPage,
})

function SetoranDetailPage() {
  const { setId } = Route.useParams()
  const router = useRouter()
  
  const fetchDetail = useServerFn(getSetoranDetailUstadz)
  const submitFeedback = useServerFn(submitFeedbackSetoran)
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [catatan, setCatatan] = useState('')
  const [isTemplate, setIsTemplate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const res = await fetchDetail({ data: { setoranId: setId } })
        if (res.success && res.data) {
          setData(res.data)
        } else {
          setError((res as any).message || 'Setoran tidak ditemukan')
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail setoran')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [setId, fetchDetail])

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const res = await submitFeedback({ data: {
        setoranId: setId,
        catatan: catatan || undefined,
        isTemplate
      } })
      if (res.success) {
        alert('Tanggapan berhasil disimpan.')
        router.navigate({ to: '/ustadz/notifikasi' })
      } else {
        alert((res as any).message || 'Gagal menyimpan tanggapan')
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-4">{error || 'Data tidak ditemukan'}</p>
        <button onClick={() => router.history.back()} className="text-emerald-600 font-medium">Kembali</button>
      </div>
    )
  }

  const isDitinjau = data.ditinjauOlehUstadz
  const respon = data.responUstadz

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.history.back()}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Tinjau Setoran Mandiri</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{data.santri?.nama}</h2>
            <p className="text-sm text-slate-500">{data.santri?.kelas?.nama}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md uppercase">
              {data.jenis}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
          <div>
            <p className="text-slate-500 mb-1">Tanggal</p>
            <p className="font-medium text-slate-900">
              {format(new Date(data.tanggalSetoran), 'dd MMM yyyy', { locale: id })}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Sumber</p>
            <p className="font-medium text-slate-900">Laporan Mandiri</p>
          </div>
          
          <div className="col-span-2">
            <p className="text-slate-500 mb-1">Capaian</p>
            <p className="font-medium text-slate-900">
              {data.lintasJuz ? `Juz ${data.juzMulai} - ${data.juzSelesai}` : `Juz ${data.juz}`} 
              {data.halamanAwal && data.halamanAkhir ? `, Halaman ${data.halamanAwal} - ${data.halamanAkhir}` : ''}
            </p>
          </div>
          
          {data.kualitas && (
            <div className="col-span-2">
              <p className="text-slate-500 mb-1">Kualitas Hafalan (Self-Assessment)</p>
              <p className="font-medium text-slate-900 capitalize">{data.kualitas}</p>
            </div>
          )}
          
          {data.catatan && (
            <div className="col-span-2">
              <p className="text-slate-500 mb-1">Catatan Santri</p>
              <div className="bg-slate-50 p-3 rounded-lg text-slate-700 italic border border-slate-100">
                "{data.catatan}"
              </div>
            </div>
          )}
        </div>
      </div>

      {!isDitinjau ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Berikan Tanggapan
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {['Masya Allah, semangat!', 'Baarakallahu fiikum', 'Terus istiqamah'].map(tmpl => (
              <button
                key={tmpl}
                onClick={() => {
                  setCatatan(tmpl)
                  setIsTemplate(true)
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-full border border-slate-200 transition-colors"
              >
                {tmpl}
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Catatan (Opsional)
            </label>
            <textarea
              value={catatan}
              onChange={e => {
                setCatatan(e.target.value)
                setIsTemplate(false)
              }}
              placeholder="Berikan motivasi atau catatan perbaikan..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px]"
            />
            
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`mt-4 w-full text-white font-semibold py-2.5 rounded-lg flex items-center justify-center transition-colors disabled:opacity-70 ${
                catatan.trim() ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Menyimpan...</>
              ) : catatan.trim() ? 'Kirim Tanggapan' : '👍 Tandai Sudah Dipantau'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
            <Check className="w-5 h-5" />
            Sudah Ditinjau
          </div>
          <p className="text-sm text-emerald-700/80">
            Anda telah memberikan tanggapan untuk setoran ini.
          </p>
          
          {respon && (
             respon.tipe === 'ditinjau' ? (
               <div className="mt-4 flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100/50 w-fit">
                 <Check className="w-4 h-4" />
                 <span className="text-sm font-medium">Telah dipantau pada {format(new Date(respon.diresponPada), 'dd MMM HH:mm', { locale: id })}</span>
               </div>
             ) : (
               <div className="mt-4 p-4 bg-white rounded-lg border border-emerald-100/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                      respon.tipe === 'disetujui' ? 'bg-emerald-100 text-emerald-700' :
                      respon.tipe === 'perlu_perbaikan' ? 'bg-red-100 text-red-700' :
                      respon.tipe === 'komentar' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {respon.tipe.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(respon.diresponPada), 'dd MMM HH:mm', { locale: id })}
                    </span>
                  </div>
                  {respon.catatan && (
                    <p className="text-sm text-slate-700">{respon.catatan}</p>
                  )}
               </div>
             )
          )}
        </div>
      )}
    </div>
  )
}

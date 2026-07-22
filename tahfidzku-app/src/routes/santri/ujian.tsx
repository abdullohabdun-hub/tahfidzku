import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { getRiwayatUjianSantri } from '../../server-fns/ujian'
import { Loader2, History, AlertCircle, Calendar, GraduationCap } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export const Route = createFileRoute('/santri/ujian')({
  component: SantriRiwayatUjian,
})

const STATUS_MAP = {
  lulus: { label: 'Lulus', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  tidak_lulus: { label: 'Tidak Lulus', color: 'text-red-700 bg-red-50 border-red-200' },
}

const KELANCARAN_MAP = {
  lancar: { label: 'Lancar', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  mengulang: { label: 'Mengulang', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  terbata: { label: 'Terbata', color: 'text-red-600 bg-red-50 border-red-200' },
}

const TAJWID_MAP = {
  sempurna: { label: 'Sempurna', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  cukup: { label: 'Cukup', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  kurang: { label: 'Kurang', color: 'text-red-600 bg-red-50 border-red-200' },
}

function SantriRiwayatUjian() {
  const [data, setData] = useState<any[]>([])
  const [juzPending, setJuzPending] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getRiwayatUjianSantri()
      if (res.success) {
        setData(res.data.riwayat)
        setJuzPending(res.data.juzUjianPending)
      } else {
        setErrorMsg(res.error?.message || 'Gagal memuat riwayat ujian')
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
        <div className="bg-blue-100 p-2 rounded-lg">
          <GraduationCap className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Ujian Kenaikan Juz</h1>
          <p className="text-xs text-slate-500">Hasil evaluasi bacaan dan kelancaran hafalan</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Banner Ujian Pending */}
        {juzPending !== null && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 shadow-sm">
            <div className="shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-800 mb-1">
                Ujian Kenaikan Juz {juzPending} Menunggu
              </h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Anda telah menyelesaikan hafalan Juz {juzPending}. Ujian sedang menunggu jadwal dari Ustadz Anda. Terus murojaah agar lancar saat diuji.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        {data.length === 0 && !errorMsg ? (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-100 shadow-sm mt-6">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Belum ada riwayat ujian</p>
            <p className="text-xs text-slate-400 mt-1">Ujian yang Anda lalui akan tercatat di sini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.length > 0 && <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Riwayat Ujian</h2>}
            {data.map((item) => {
              const status = STATUS_MAP[item.status as keyof typeof STATUS_MAP]
              const kelancaran = KELANCARAN_MAP[item.kelancaran as keyof typeof KELANCARAN_MAP]
              const tajwid = TAJWID_MAP[item.tajwid as keyof typeof TAJWID_MAP]

              return (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative flex flex-col gap-3 overflow-hidden">
                  
                  {/* Status Badge */}
                  <div className="absolute top-0 right-0 flex">
                    {status && (
                      <div className={`text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest ${status.color}`}>
                        {status.label}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between mt-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </p>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                        Juz {item.juz}
                        {item.attempt > 1 && (
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Ujian ke-{item.attempt}
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>

                  {/* Kriteria & Skor */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Kelancaran</p>
                      <div className={`inline-block px-2 py-0.5 border rounded text-xs font-semibold ${kelancaran?.color || 'bg-slate-100'}`}>
                        {kelancaran?.label || item.kelancaran}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Tajwid</p>
                      <div className={`inline-block px-2 py-0.5 border rounded text-xs font-semibold ${tajwid?.color || 'bg-slate-100'}`}>
                        {tajwid?.label || item.tajwid}
                      </div>
                    </div>
                    <div className="col-span-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Nilai Akhir</span>
                      <span className="text-sm font-black text-slate-700">{item.skor} / 100</span>
                    </div>
                  </div>

                  {item.catatan && (
                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100 mt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Ustadz</p>
                      {item.catatan}
                    </div>
                  )}

                  {/* Penguji Info */}
                  <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Penguji: {item.ustadzNama}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

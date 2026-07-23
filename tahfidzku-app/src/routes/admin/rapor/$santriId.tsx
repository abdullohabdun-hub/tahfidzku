import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Printer, Loader2, ArrowLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { getSantriRaporData } from '../../../server-fns/rapor'
import { RaporTemplate } from '../../../components/Rapor/RaporTemplate'
import { Button } from '../../../components/ui/button'

export const Route = createFileRoute('/admin/rapor/$santriId')({
  component: RaporPage,
})

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function RaporPage() {
  const { santriId } = Route.useParams()

  const now = new Date()
  const [mode, setMode] = useState<'bulanan' | 'semester_ganjil' | 'semester_genap' | 'tahunan'>('bulanan')
  const [bulan, setBulan] = useState(now.getMonth() + 1) // 1-12
  const [tahunAjaran, setTahunAjaran] = useState(now.getFullYear())

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const tanggalCetak = useRef(new Date())

  async function loadRapor(m: string, b: number, t: number) {
    setLoading(true)
    setError(null)
    try {
      const res = await getSantriRaporData({ data: { santriId, mode: m as any, bulan: b, tahunAjaran: t } })
      if (res.success && res.data) {
        setData(res.data)
        tanggalCetak.current = new Date()
      } else {
        setError((res as any).error?.message ?? 'Gagal memuat data rapor')
      }
    } catch (e: any) {
      setError(e.message ?? 'Terjadi kesalahan')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRapor(mode, bulan, tahunAjaran)
  }, [mode, bulan, tahunAjaran])

  function prevBulan() {
    if (bulan === 1) { setBulan(12); setTahunAjaran(t => t - 1) }
    else setBulan(b => b - 1)
  }
  function nextBulan() {
    if (bulan === 12) { setBulan(1); setTahunAjaran(t => t + 1) }
    else setBulan(b => b + 1)
  }

  return (
    <div className="space-y-6">

      {/* ── TOOLBAR (hanya tampil di layar, tersembunyi saat cetak) ── */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/santri">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 hover:text-slate-900 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Data Santri
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Cetak Rapor Hafalan
            </h2>
            {data?.profil && (
              <p className="text-slate-500 text-sm mt-0.5">{data.profil.nama}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* Tabs Mode */}
          <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
            <button 
              onClick={() => setMode('bulanan')} 
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'bulanan' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Bulanan
            </button>
            <button 
              onClick={() => setMode('semester_ganjil')} 
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${(mode === 'semester_ganjil' || mode === 'semester_genap') ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semesteran
            </button>
            <button 
              onClick={() => setMode('tahunan')} 
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'tahunan' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tahunan
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Navigasi Periode */}
            {mode === 'bulanan' ? (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <button onClick={prevBulan} className="p-2 hover:bg-slate-50 text-slate-500 transition-colors" title="Bulan sebelumnya">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-2 text-sm font-semibold text-slate-800 min-w-[130px] text-center">
                  {NAMA_BULAN[bulan - 1]} {tahunAjaran}
                </div>
                <button onClick={nextBulan} className="p-2 hover:bg-slate-50 text-slate-500 transition-colors" title="Bulan berikutnya">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (mode === 'semester_ganjil' || mode === 'semester_genap') ? (
              <div className="flex gap-2">
                <select value={mode} onChange={e => setMode(e.target.value as any)} className="border border-slate-200 shadow-sm rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none bg-white">
                  <option value="semester_ganjil">Semester Ganjil</option>
                  <option value="semester_genap">Semester Genap</option>
                </select>
                <select value={tahunAjaran} onChange={e => setTahunAjaran(Number(e.target.value))} className="border border-slate-200 shadow-sm rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none bg-white">
                  {[...Array(7)].map((_, i) => {
                    const y = now.getFullYear() - 3 + i;
                    return <option key={y} value={y}>{y}/{y+1}</option>
                  })}
                </select>
              </div>
            ) : (
              <select value={tahunAjaran} onChange={e => setTahunAjaran(Number(e.target.value))} className="border border-slate-200 shadow-sm rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none bg-white">
                {[...Array(7)].map((_, i) => {
                  const y = now.getFullYear() - 3 + i;
                  return <option key={y} value={y}>Tahun Ajaran {y}/{y+1}</option>
                })}
              </select>
            )}

            <Button
              onClick={() => window.print()}
              disabled={loading || !data}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-10 px-5"
            >
              <Printer className="w-4 h-4" />
              Cetak / Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── AREA KONTEN ── */}
      {loading && (
        <div className="print:hidden flex items-center justify-center min-h-[400px] text-emerald-600">
          <Loader2 className="animate-spin w-10 h-10" />
        </div>
      )}

      {error && !loading && (
        <div className="print:hidden flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-2">
          <FileText className="w-10 h-10 text-red-200" />
          <p className="font-medium">{error}</p>
          <Button variant="outline" onClick={() => loadRapor(mode, bulan, tahunAjaran)} className="mt-2">
            Coba Lagi
          </Button>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Info banner pengaturan kosong — screen only */}
          {!data.raporSettings && (
            <div className="print:hidden bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
              <span>⚠️</span>
              <span>
                Kop surat kosong karena Pengaturan Rapor belum diisi.{' '}
                <Link to="/admin/pengaturan" className="font-semibold underline">
                  Lengkapi sekarang →
                </Link>
              </span>
            </div>
          )}

          {/* Wrapper shadow untuk tampilan screen — dibuang saat cetak */}
          <div className="print:shadow-none print:border-none shadow-xl rounded-xl border border-slate-200 overflow-hidden bg-white">
            <RaporTemplate data={data} tanggalCetak={tanggalCetak.current} />
          </div>
        </>
      )}
    </div>
  )
}

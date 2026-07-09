import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { inputMurojaah } from '../../server-fns/santri-functions'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { getMaksimalHalamanRelatif, buatSurahMeta } from '../../../quranMapper.js'

export const Route = createFileRoute('/santri/input')({
  component: SantriInputMurojaah,
})

function SantriInputMurojaah() {
  const navigate = useNavigate()
  
  const [jenis, setJenis] = useState<'sabqi' | 'manzil'>('sabqi')
  const [juz, setJuz] = useState<number>(30)
  const [halaman, setHalaman] = useState<number>(1)
  const [kualitas, setKualitas] = useState<'lancar' | 'mengulang' | 'terbata'>('lancar')
  
  const [submitting, setSubmitting] = useState(false)
  const [surahInfo, setSurahInfo] = useState<string>('-')

  useEffect(() => {
    try {
      const meta = buatSurahMeta(juz, halaman, halaman)
      if (meta && meta.label) {
        setSurahInfo(meta.label)
      } else {
        setSurahInfo('Halaman di luar batas Juz')
      }
    } catch (err) {
      setSurahInfo('Data halaman tidak valid')
    }
  }, [juz, halaman])

  const maxHalaman = getMaksimalHalamanRelatif(juz)

  // Handle Juz change ensuring page doesn't exceed max
  const handleJuzChange = (newJuz: number) => {
    setJuz(newJuz)
    const newMax = getMaksimalHalamanRelatif(newJuz)
    if (halaman > newMax) setHalaman(newMax)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await inputMurojaah({
        data: {
          jenis,
          juz,
          halaman,
          suratNama: surahInfo,
          kualitas,
        }
      })

      if (res.success) {
        alert(res.message)
        navigate({ to: '/santri' })
      } else {
        alert(res.error?.message || 'Gagal menyimpan murojaah')
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <h1 className="text-xl font-bold text-slate-800">Lapor Murojaah</h1>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-600 p-4 text-white">
          <h2 className="font-bold text-lg">Input Hafalan Mandiri</h2>
          <p className="text-sm opacity-90">Laporkan hasil murojaah harianmu secara jujur.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            
            {/* Jenis Setoran */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Jenis Murojaah</label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setJenis('sabqi')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${jenis === 'sabqi' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                >
                  <div className="font-bold">Sabqi</div>
                  <div className="text-[10px] mt-1 opacity-70">Hafalan Dekat</div>
                </div>
                <div 
                  onClick={() => setJenis('manzil')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${jenis === 'manzil' ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                >
                  <div className="font-bold">Manzil</div>
                  <div className="text-[10px] mt-1 opacity-70">Hafalan Jauh</div>
                </div>
              </div>
            </div>

            {/* Juz & Halaman */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Juz</label>
                <select 
                  className="w-full h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-lg text-center"
                  value={juz}
                  onChange={(e) => handleJuzChange(Number(e.target.value))}
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Halaman</label>
                <select 
                  className="w-full h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-lg text-center"
                  value={halaman}
                  onChange={(e) => setHalaman(Number(e.target.value))}
                >
                  {Array.from({ length: maxHalaman }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Otomatis terbaca */}
            <div className="bg-slate-100 rounded-xl p-4 text-center">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block mb-1">Membaca Surat & Ayat</span>
              <span className="font-bold text-slate-800 text-lg">{surahInfo}</span>
            </div>

            {/* Penilaian Diri (Muhasabah) */}
            <div className="space-y-3 pt-2">
              <label className="text-sm font-semibold text-slate-700">Muhasabah Kelancaran</label>
              <div className="grid grid-cols-3 gap-2">
                <div 
                  onClick={() => setKualitas('lancar')}
                  className={`p-2 text-center rounded-xl border cursor-pointer transition-all ${kualitas === 'lancar' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                >
                  Lancar
                </div>
                <div 
                  onClick={() => setKualitas('mengulang')}
                  className={`p-2 text-center rounded-xl border cursor-pointer transition-all ${kualitas === 'mengulang' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                >
                  Mengulang
                </div>
                <div 
                  onClick={() => setKualitas('terbata')}
                  className={`p-2 text-center rounded-xl border cursor-pointer transition-all ${kualitas === 'terbata' ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                >
                  Terbata
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base mt-4 shadow-emerald-200 shadow-lg"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Kirim Laporan'}
            </Button>

          </CardContent>
        </form>
      </Card>
    </div>
  )
}

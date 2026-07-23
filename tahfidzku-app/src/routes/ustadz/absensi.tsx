import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { getKelasYangDiampu, bukaSesiAbsensi, simpanAbsensi } from '../../server-fns/absensi'
import { Loader2, Calendar, Users, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { Button } from '../../components/ui/button'

export const Route = createFileRoute('/ustadz/absensi')({
  component: AbsensiUstadzPage,
})

type SantriAbsensi = {
  id: string
  nama: string
  status?: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'terlambat'
  catatan?: string
}

const HARI_MAP = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

function AbsensiUstadzPage() {
  const [kelasList, setKelasList] = useState<any[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  
  // Sesi config
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  
  // Status sesi aktif
  const [loadingSesi, setLoadingSesi] = useState(false)
  const [sesiId, setSesiId] = useState<string | null>(null)
  const [daftarSantri, setDaftarSantri] = useState<SantriAbsensi[]>([])


  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    async function init() {
      const res = await getKelasYangDiampu()
      if (res.success && res.data) {
        setKelasList(res.data)
        if (res.data.length > 0) setSelectedKelasId(res.data[0].id)
      }
      setLoadingInitial(false)
    }
    init()
  }, [])

  const getJadwalStatus = () => {
    if (!selectedKelasId || !tanggal) return 'sesuai'
    const k = kelasList.find(x => x.id === selectedKelasId)
    if (!k || !k.hariPertemuan || k.hariPertemuan.length === 0 || (k.hariPertemuan.length === 1 && !k.hariPertemuan[0])) return 'belum_diatur'
    
    const dayIndex = new Date(tanggal).getDay()
    const hari = HARI_MAP[dayIndex]
    return k.hariPertemuan.includes(hari) ? 'sesuai' : 'luar_jadwal'
  }

  const handleBukaSesi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedKelasId || !tanggal) return
    setLoadingSesi(true)
    setErrorMsg('')
    setSuccessMsg('')
    setSesiId(null)

    const res = await bukaSesiAbsensi({ data: { kelasId: selectedKelasId, tanggal } })
    if (res.success && res.data) {
      setSesiId(res.data.sesiId)

      
      // Merge daftar santri dengan absensi tersimpan
      const tersimpan = res.data.absensiTersimpan || []
      const merged = res.data.daftarSantri.map((s: any) => {
        const d = tersimpan.find((t: any) => t.santriId === s.id)
        return {
          id: s.id,
          nama: s.nama,
          status: d?.status,
          catatan: d?.catatan || ''
        }
      })
      setDaftarSantri(merged)
    } else {
      setErrorMsg((res as any).error?.message || 'Gagal membuka sesi absensi')
    }
    setLoadingSesi(false)
  }

  const handleUpdateStatus = (santriId: string, status: SantriAbsensi['status']) => {
    setDaftarSantri(prev => prev.map(s => s.id === santriId ? { ...s, status } : s))
  }

  const handleUpdateCatatan = (santriId: string, catatan: string) => {
    setDaftarSantri(prev => prev.map(s => s.id === santriId ? { ...s, catatan } : s))
  }

  const tandaiSemuaHadir = () => {
    setDaftarSantri(prev => prev.map(s => (!s.status ? { ...s, status: 'hadir' } : s)))
  }

  const handleSubmitAbsensi = async () => {
    if (!sesiId) return
    // Cek apakah ada yang belum ditandai
    const uncompleted = daftarSantri.filter(s => !s.status)
    if (uncompleted.length > 0) {
      if (!confirm(`Ada ${uncompleted.length} santri yang belum ditandai. Tetap simpan?`)) return
    }

    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    const daftarStatus = daftarSantri.filter(s => !!s.status).map(s => ({
      santriId: s.id,
      status: s.status!,
      catatan: s.catatan
    }))

    const res = await simpanAbsensi({ data: { sesiKelasId: sesiId, daftarStatus } })
    if (res.success) {
      setSuccessMsg('Absensi berhasil disimpan')
    } else {
      setErrorMsg(res.error?.message || 'Gagal menyimpan absensi')
    }
    setSubmitting(false)
  }

  if (loadingInitial) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
  }

  const STATUS_CONFIG = [
    { value: 'hadir', label: 'Hadir', bg: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-white' },
    { value: 'izin', label: 'Izin', bg: 'bg-blue-500 hover:bg-blue-600', text: 'text-white' },
    { value: 'sakit', label: 'Sakit', bg: 'bg-yellow-500 hover:bg-yellow-600', text: 'text-white' },
    { value: 'alpa', label: 'Alpa', bg: 'bg-red-500 hover:bg-red-600', text: 'text-white' },
    { value: 'terlambat', label: 'Terlambat', bg: 'bg-orange-500 hover:bg-orange-600', text: 'text-white' },
  ] as const

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Input Absensi</h2>
          <p className="text-slate-500">Tandai kehadiran santri per sesi pertemuan.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
        <form onSubmit={handleBukaSesi} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Pilih Kelas</label>
            <select required value={selectedKelasId} onChange={e => setSelectedKelasId(e.target.value)} className="w-full border p-2.5 rounded-lg bg-slate-50">
              <option value="" disabled>-- Kelas yang Anda Ampu --</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full relative">
            <label className="block text-sm font-medium mb-1">Tanggal Sesi</label>
            <input required type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full border p-2.5 rounded-lg bg-slate-50" />
            {getJadwalStatus() === 'luar_jadwal' && (
              <span className="absolute -bottom-5 left-0 text-xs text-orange-600 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Di luar jadwal reguler
              </span>
            )}
            {getJadwalStatus() === 'belum_diatur' && (
              <span className="absolute -bottom-5 left-0 text-xs text-slate-500 font-medium flex items-center gap-1">
                <Info className="w-3 h-3" /> Kelas belum punya jadwal reguler
              </span>
            )}
          </div>
          <Button type="submit" disabled={loadingSesi || !selectedKelasId} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white h-[46px] px-8">
            {loadingSesi ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
            Buka Sesi
          </Button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}

      {sesiId && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-slate-800">Daftar Santri <span className="text-slate-400 font-normal ml-2">({daftarSantri.length} orang)</span></h3>
            <Button variant="outline" size="sm" onClick={tandaiSemuaHadir} className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Semua Hadir
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-50">
            {daftarSantri.map((santri, index) => (
              <div key={santri.id} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-slate-50/80 transition-colors">
                <div className="w-full sm:w-1/3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div className="font-medium text-slate-900">{santri.nama}</div>
                </div>
                
                <div className="w-full sm:w-2/3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {STATUS_CONFIG.map(cfg => (
                      <button
                        key={cfg.value}
                        type="button"
                        onClick={() => handleUpdateStatus(santri.id, cfg.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          santri.status === cfg.value 
                            ? `${cfg.bg} ${cfg.text} shadow-sm ring-2 ring-offset-1 ring-${cfg.bg.split('-')[1]}-400`
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                  {santri.status && santri.status !== 'hadir' && (
                    <input
                      type="text"
                      placeholder="Catatan opsional..."
                      value={santri.catatan || ''}
                      onChange={e => handleUpdateCatatan(santri.id, e.target.value)}
                      className="w-full text-sm border-b border-slate-200 p-1 focus:border-emerald-500 focus:outline-none bg-transparent"
                    />
                  )}
                </div>
              </div>
            ))}
            
            {daftarSantri.length === 0 && (
              <div className="p-8 text-center text-slate-500">Belum ada santri di kelas ini.</div>
            )}
          </div>

          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}

          <div className="sticky bottom-4 z-10">
            <Button onClick={handleSubmitAbsensi} disabled={submitting || daftarSantri.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg shadow-lg">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Simpan Absensi
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

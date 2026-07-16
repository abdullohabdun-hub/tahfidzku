import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { getSantriList } from '../../server-fns/santri'
import { createSetoran } from '../../server-fns/setoran'
import { SetoranForm } from '../../components/SetoranForm'
import { posisiTerakhirDariJumlahJuzSelesai, urutanJuzStandar } from '../../lib/quranMapper'

export const Route = createFileRoute('/ustadz/input')({
  component: InputSetoranPage,
})

function InputSetoranPage() {
  const [santriList, setSantriList] = useState<any[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  
  const [santriId, setSantriId] = useState('')
  const selectedSantri = useMemo(() => santriList.find(s => s.id === santriId), [santriId, santriList])

  // Setup Hafalan Awal (Santri Baru)
  const [showSetup, setShowSetup] = useState(false)
  const [jumlahJuzSelesai, setJumlahJuzSelesai] = useState(0)
  const urutanHafalan = useMemo(() => selectedSantri?.urutanHafalan ?? urutanJuzStandar(), [selectedSantri])

  useEffect(() => {
    async function init() {
      try {
        const res = await getSantriList()
        if (res.success && res.data) {
          setSantriList(res.data)
          if (res.data.length > 0) setSantriId(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load santri', err)
      } finally {
        setLoadingInitial(false)
      }
    }
    init()
  }, [])

  const handleApplySetupAwal = () => {
    const posisiAwal = posisiTerakhirDariJumlahJuzSelesai(urutanHafalan, jumlahJuzSelesai);
    setSantriList(prev => prev.map(s => {
      if (s.id === santriId) {
        return { ...s, posisiTerakhir: posisiAwal }
      }
      return s
    }))
    setShowSetup(false)
  }

  const handleCreateSetoran = async (payload: any) => {
    const res = await createSetoran({ data: payload })
    if (res.success) {
      if (payload.jenis === 'ziyadah') {
        const surahSelesaiNomor = payload.surahMeta?.meta?.[0]?.surahSelesai?.nomor ?? payload.surahNomor
        const ayatSelesai = payload.surahMeta?.meta?.[0]?.surahSelesai?.ayat ?? payload.ayatAkhir

        setSantriList(prev => prev.map(s => {
          if (s.id === santriId) {
            return { ...s, posisiTerakhir: { surahNomor: surahSelesaiNomor, ayat: ayatSelesai } }
          }
          return s
        }))
      }
    }
    return res
  }

  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (santriList.length === 0) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-bold text-slate-800">Belum ada Santri</h2>
        <p className="text-sm text-slate-500">Silakan tambahkan santri melalui menu admin.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8">
      {/* 1. Pemilihan Santri */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative z-10">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Santri yang Disimak</label>
        <div className="relative">
          <select
            value={santriId}
            onChange={(e) => setSantriId(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block px-3 py-2.5 pr-8 font-medium"
          >
            {santriList.map((s) => (
              <option key={s.id} value={s.id}>{s.nama} ({s.kelas?.nama})</option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* 1.5 Setup Hafalan Awal untuk Santri Baru */}
      {!selectedSantri?.posisiTerakhir && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-emerald-800 text-sm mb-1">Posisi Hafalan Awal</h3>
          <p className="text-emerald-700 text-xs mb-3">Santri ini belum memiliki riwayat hafalan. Tentukan titik awal agar sistem bisa memandu secara otomatis.</p>
          
          {!showSetup ? (
            <button 
              onClick={() => setShowSetup(true)}
              className="text-xs font-bold bg-white text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100"
            >
              Atur Posisi Sekarang
            </button>
          ) : (
            <div className="flex gap-2 items-end">
               <div className="flex-1">
                 <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Sudah Hafal Berapa Juz?</label>
                 <select 
                   value={jumlahJuzSelesai}
                   onChange={e => setJumlahJuzSelesai(Number(e.target.value))}
                   className="w-full text-sm border-emerald-200 rounded-lg py-2"
                 >
                   {Array.from({length: 31}, (_, i) => i).map(n => (
                     <option key={n} value={n}>{n} Juz</option>
                   ))}
                 </select>
               </div>
               <button 
                  onClick={handleApplySetupAwal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg h-[38px]"
               >
                 Terapkan
               </button>
            </div>
          )}
        </div>
      )}

      {/* Form Setoran Utama */}
      <SetoranForm
        mode="create"
        santri={selectedSantri}
        onSubmit={handleCreateSetoran}
      />
    </div>
  )
}

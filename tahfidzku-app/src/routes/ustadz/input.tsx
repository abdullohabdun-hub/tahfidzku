import { createFileRoute, Link } from '@tanstack/react-router'
import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDown, Loader2, AlertTriangle } from 'lucide-react'
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
  
  const [selectedKelasNama, setSelectedKelasNama] = useState<string>('Semua Kelas')
  const [santriId, setSantriId] = useState('')
  const selectedSantri = useMemo(() => santriList.find(s => s.id === santriId), [santriId, santriList])

  const kelasList = useMemo(() => {
    return Array.from(new Set(santriList.map(s => s.kelasNama || 'Tanpa Kelas')))
  }, [santriList])

  const santriFiltered = useMemo(() => {
    if (!selectedKelasNama || selectedKelasNama === 'Semua Kelas') return santriList
    return santriList.filter(s => (s.kelasNama || 'Tanpa Kelas') === selectedKelasNama)
  }, [santriList, selectedKelasNama])

  useEffect(() => {
    if (santriFiltered.length > 0) {
      if (!santriFiltered.find(s => s.id === santriId)) {
        setSantriId(santriFiltered[0].id)
      }
    } else {
      setSantriId('')
    }
  }, [santriFiltered, santriId])

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
      {/* 1. Pemilihan Kelas (hanya muncul jika kelas > 1) */}
      {kelasList.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative z-20">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Pilih Kelas / Halaqoh</label>
          <div className="relative">
            <select
              value={selectedKelasNama}
              onChange={(e) => setSelectedKelasNama(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block px-3 py-2.5 pr-8 font-medium"
            >
              <option value="Semua Kelas">-- Semua Kelas --</option>
              {kelasList.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      )}

      {/* 2. Pemilihan Santri */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative z-10">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Santri yang Disimak</label>
        {santriFiltered.length === 0 ? (
          <div className="p-3 text-sm text-slate-500 text-center bg-slate-50 rounded-lg border border-slate-100">
            Tidak ada santri di kelas ini.
          </div>
        ) : (
          <div className="relative">
            <select
              value={santriId}
              onChange={(e) => setSantriId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block px-3 py-2.5 pr-8 font-medium"
            >
              {santriFiltered.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} {selectedKelasNama === 'Semua Kelas' && s.kelasNama ? `(${s.kelasNama})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        )}
      </div>

      {/* UJIAN PENDING BANNER */}
      {selectedSantri?.juzUjianPending && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">
              ⛔ Ziyadah diblokir — Ujian Kenaikan Juz {selectedSantri.juzUjianPending} belum diselesaikan
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Santri ini harus lulus ujian terlebih dahulu sebelum bisa melanjutkan hafalan ke juz berikutnya.
            </p>
          </div>
          <Link
            to="/ustadz/ujian"
            className="shrink-0 text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Buka Ujian →
          </Link>
        </div>
      )}

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

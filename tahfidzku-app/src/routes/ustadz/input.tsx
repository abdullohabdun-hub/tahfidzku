import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, Loader2, AlertTriangle, Info } from 'lucide-react'
import { getSantriList, setupSantriInitialHafalan } from '../../server-fns/santri'
import { createSetoran } from '../../server-fns/setoran'
import { SetoranForm } from '../../components/SetoranForm'
import { SetoranIqraForm } from '../../components/SetoranIqraForm'
import { createSetoranIqra } from '../../server-fns/setoran-iqra'
import { bangunPosisiDariAdminInput } from '../../lib/quranMapper'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'

export const Route = createFileRoute('/ustadz/input')({
  component: InputSetoranPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      santriId: (search.santriId as string) || undefined,
    }
  },
})

function InputSetoranPage() {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/ustadz/input' })
  const [authError, setAuthError] = useState<{ message: string, code?: string } | null>(null)

  const [santriList, setSantriList] = useState<any[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  
  const [selectedKelasNama, setSelectedKelasNama] = useState<string>('Semua Kelas')
  const [santriId, setSantriId] = useState(searchParams.santriId || '')
  const selectedSantri = useMemo(() => santriList.find(s => s.id === santriId), [santriId, santriList])

  const kelasList = useMemo(() => {
    return Array.from(new Set(santriList.map(s => s.kelasNama || 'Tanpa Kelas')))
  }, [santriList])

  const santriFiltered = useMemo(() => {
    if (!selectedKelasNama || selectedKelasNama === 'Semua Kelas') return santriList
    return santriList.filter(s => (s.kelasNama || 'Tanpa Kelas') === selectedKelasNama)
  }, [santriList, selectedKelasNama])

  useEffect(() => {
    if (searchParams.santriId && santriList.some(s => s.id === searchParams.santriId)) {
      setSantriId(searchParams.santriId)
      return
    }
    if (santriFiltered.length > 0) {
      if (!santriFiltered.find(s => s.id === santriId)) {
        setSantriId(santriFiltered[0].id)
      }
    } else {
      setSantriId('')
    }
  }, [santriFiltered, santriId, searchParams.santriId, santriList])

  // Setup Hafalan Awal (Santri Baru)
  const [showSetup, setShowSetup] = useState(false)
  const [isApplyingSetup, setIsApplyingSetup] = useState(false)
  const [juzProgress, setJuzProgress] = useState<number[]>([])
  const [batasHafalanJuz, setBatasHafalanJuz] = useState<number | ''>('')
  const [batasHafalanSurah, setBatasHafalanSurah] = useState<string>('')
  const [batasHafalanAyat, setBatasHafalanAyat] = useState<number | ''>('')
  const [surahOptions, setSurahOptions] = useState<any[]>([])
  const [ayatMax, setAyatMax] = useState<number>(999)

  useEffect(() => {
    if (batasHafalanJuz !== '') {
      import('../../lib/quranMapper').then(({ getSurahByJuz }) => {
        setSurahOptions(getSurahByJuz(Number(batasHafalanJuz)))
      })
    } else {
      setSurahOptions([])
      setBatasHafalanSurah('')
    }
  }, [batasHafalanJuz])

  useEffect(() => {
    if (batasHafalanJuz !== '' && batasHafalanSurah) {
      import('../../lib/quranMapper').then(({ getAyatRangeInJuz }) => {
        const range = getAyatRangeInJuz(Number(batasHafalanJuz), batasHafalanSurah)
        setAyatMax(range.ayatAkhir)
      })
    } else {
      setAyatMax(999)
    }
  }, [batasHafalanJuz, batasHafalanSurah])

  const fetchSantriList = async () => {
    try {
      const res = await getSantriList({ data: { fetchAll: true } })
      if (!res.success) {
        if (res.error?.code === 'UNAUTHENTICATED') {
          navigate({ to: '/login' })
          return
        }
        setAuthError({ message: res.error?.message || 'Akses ditolak', code: res.error?.code })
        return
      }
      if (res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data.items || [])
        setSantriList(items)
        setSantriId((prev: any) => {
          if (prev && items.find((s: any) => s.id === prev)) return prev
          return items.length > 0 ? items[0].id : ''
        })
      }
    } catch (err: any) {
      console.error('Failed to load santri', err)
      setAuthError({ message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' })
    } finally {
      setLoadingInitial(false)
    }
  }

  useEffect(() => {
    fetchSantriList()
  }, [])

  const handleApplySetupAwal = async () => {
    // Validasi dasar
    if (juzProgress.length === 0 && (batasHafalanJuz === '' || !batasHafalanSurah || batasHafalanAyat === '')) {
      alert('Harap isi Juz yang selesai dihafal ATAU batas hafalan terakhir.')
      return
    }
    
    setIsApplyingSetup(true)
    try {
      const payload = {
        santriId,
        juzProgress,
        batasHafalanJuz: batasHafalanJuz !== '' ? Number(batasHafalanJuz) : null,
        batasHafalanSurah: batasHafalanSurah ? batasHafalanSurah : null,
        batasHafalanAyat: batasHafalanAyat !== '' ? Number(batasHafalanAyat) : null
      }

      const res = await setupSantriInitialHafalan({ data: payload })
      if (!res.success) {
        throw new Error(res.error?.message || 'Gagal menyimpan posisi awal')
      }

      // Hitung posisi lokal untuk update state
      const { posisiTerakhir: posisiAwal, urutanHafalan } = bangunPosisiDariAdminInput(
        payload.juzProgress,
        payload.batasHafalanJuz,
        payload.batasHafalanSurah,
        payload.batasHafalanAyat
      )

      setSantriList(prev => prev.map(s => {
        if (s.id === santriId) {
          return { ...s, posisiTerakhir: posisiAwal, urutanHafalan, juzProgress }
        }
        return s
      }))
      setShowSetup(false)
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan')
    } finally {
      setIsApplyingSetup(false)
    }
  }

  const handleCreateSetoran = async (payload: any) => {
    const res = await createSetoran({ data: payload })
    if (res.success) {
      if (payload.jenis === 'ziyadah') {
        const metaList = payload.surahMeta?.meta
        const lastMeta = Array.isArray(metaList) && metaList.length > 0 ? metaList[metaList.length - 1] : null
        const surahSelesaiNomor = lastMeta?.surahSelesai?.nomor ?? payload.surahNomor
        const ayatSelesai = lastMeta?.surahSelesai?.ayat ?? payload.ayatAkhir

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

  const handleCreateSetoranIqra = async (payload: any) => {
    const res = await createSetoranIqra({ data: payload })
    if (res.success) {
      setSantriList(prev => prev.map(s => {
        if (s.id === santriId) {
          return { ...s, jilidIqraTerakhir: payload.jilid, halamanIqraTerakhir: payload.halamanAkhir }
        }
        return s
      }))
    }
    return res
  }


  if (authError) {
    return <AuthErrorAlert error={authError} />
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
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow transition-shadow">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Pilih Kelas / Halaqoh</label>
          <div className="relative group">
            <select
              value={selectedKelasNama}
              onChange={(e) => setSelectedKelasNama(e.target.value)}
              className="w-full appearance-none bg-slate-50/50 border border-slate-200/80 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block px-4 py-3 pr-10 font-semibold transition-all hover:bg-slate-50"
            >
              <option value="Semua Kelas">-- Semua Kelas --</option>
              {kelasList.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none group-hover:text-emerald-500 transition-colors" />
          </div>
        </div>
      )}

      {/* 2. Pemilihan Santri */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow transition-shadow">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Santri yang Disimak</label>
        {santriFiltered.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            Tidak ada santri di kelas ini.
          </div>
        ) : (
          <div className="relative group">
            <select
              value={santriId}
              onChange={(e) => setSantriId(e.target.value)}
              className="w-full appearance-none bg-slate-50/50 border border-slate-200/80 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block px-4 py-3 pr-10 font-semibold transition-all hover:bg-slate-50"
            >
              {santriFiltered.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} {selectedKelasNama === 'Semua Kelas' && s.kelasNama ? `(${s.kelasNama})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none group-hover:text-emerald-500 transition-colors" />
          </div>
        )}
      </div>

      {/* UJIAN PENDING BANNER (Khusus Tahfidz) */}
      {selectedSantri?.tahapSantri === 'tahfidz' && selectedSantri?.juzUjianPending && (
        <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-800 tracking-tight">
              Ziyadah Diblokir
            </p>
            <p className="text-xs text-rose-600/90 mt-0.5 mb-3 font-medium">
              Santri ini harus lulus Ujian Kenaikan Juz {selectedSantri.juzUjianPending} terlebih dahulu.
            </p>
            <Link
              to="/ustadz/ujian"
              className="inline-flex items-center text-xs font-bold bg-white text-rose-700 px-4 py-2 rounded-lg shadow-sm border border-rose-100 hover:bg-rose-100 transition-colors"
            >
              Buka Ujian →
            </Link>
          </div>
        </div>
      )}

      {/* UJIAN PENDING BANNER (Khusus Iqra) */}
      {selectedSantri?.tahapSantri === 'iqra' && selectedSantri?.jilidIqraUjianPending && (
        <div className="bg-purple-50 border border-purple-200/60 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <Info className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-purple-800 tracking-tight">
              Setoran Iqra Diblokir
            </p>
            <p className="text-xs text-purple-600/90 mt-0.5 mb-3 font-medium">
              Santri ini menunggu Ujian Kenaikan Jilid {selectedSantri.jilidIqraUjianPending}. Selesaikan ujian terlebih dahulu.
            </p>
            <Link
              to="/ustadz/ujian"
              className="inline-flex items-center text-xs font-bold bg-white text-purple-700 px-4 py-2 rounded-lg shadow-sm border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              Buka Ujian →
            </Link>
          </div>
        </div>
      )}

      {/* Indikator Iqra */}
      {selectedSantri?.tahapSantri === 'iqra' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-bold text-purple-800 text-sm mb-1">Posisi Iqra Saat Ini</h3>
          {selectedSantri.jilidIqraTerakhir == null ? (
            <p className="text-purple-700 text-xs font-medium">Santri ini belum memiliki riwayat Iqra. Catat setoran pertama untuk memulai.</p>
          ) : (
            <p className="text-purple-700 text-sm font-medium">Jilid {selectedSantri.jilidIqraTerakhir}, Halaman {selectedSantri.halamanIqraTerakhir === 0 ? '-' : selectedSantri.halamanIqraTerakhir}</p>
          )}
        </div>
      )}

      {/* 1.5 Setup Hafalan Awal untuk Santri Baru (Khusus Tahfidz) */}
      {selectedSantri?.tahapSantri === 'tahfidz' && !selectedSantri?.posisiTerakhir && (
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
             <div className="space-y-4">
               
               <div>
                 <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                   Pilih Juz yang Sudah Selesai Dihafal (Bila Ada)
                 </label>
                 <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {Array.from({length: 30}, (_, i) => i + 1).map(j => (
                      <label key={j} className={`
                        flex items-center justify-center py-1.5 rounded-lg border cursor-pointer transition-colors text-xs font-bold
                        ${juzProgress.includes(j) ? 'bg-emerald-500 border-emerald-600 text-white shadow-inner' : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'}
                      `}>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={juzProgress.includes(j)}
                          onChange={e => {
                            if (e.target.checked) setJuzProgress([...juzProgress, j].sort((a,b) => a-b))
                            else setJuzProgress(juzProgress.filter(x => x !== j))
                          }}
                        />
                        {j}
                      </label>
                    ))}
                 </div>
               </div>

               <div className="pt-3 border-t border-emerald-200/50">
                 <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                   Batas Hafalan Terakhir Santri (Opsional)
                 </label>
                 <div className="grid grid-cols-3 gap-2">
                   <select 
                     value={batasHafalanJuz} 
                     onChange={e => {
                       setBatasHafalanJuz(e.target.value ? Number(e.target.value) : '')
                       setBatasHafalanSurah('')
                       setBatasHafalanAyat('')
                     }}
                     className="text-sm border-emerald-200 rounded-lg py-2"
                   >
                     <option value="">Juz</option>
                     {Array.from({length: 30}, (_, i) => i + 1).map(j => (
                       <option key={j} value={j}>Juz {j}</option>
                     ))}
                   </select>
                   
                   <select 
                     value={batasHafalanSurah} 
                     onChange={e => {
                       setBatasHafalanSurah(e.target.value)
                       setBatasHafalanAyat('')
                     }}
                     disabled={batasHafalanJuz === ''}
                     className="text-sm border-emerald-200 rounded-lg py-2 disabled:bg-emerald-50 disabled:text-emerald-400"
                   >
                     <option value="">Surah</option>
                     {surahOptions.map(s => (
                       <option key={s.nomor} value={s.nama}>{s.nama}</option>
                     ))}
                   </select>

                   <input 
                     type="number" 
                     min={1} max={ayatMax}
                     placeholder="Ayat"
                     value={batasHafalanAyat}
                     onChange={e => setBatasHafalanAyat(e.target.value ? Number(e.target.value) : '')}
                     disabled={batasHafalanJuz === '' || !batasHafalanSurah}
                     className="text-sm border-emerald-200 rounded-lg py-2 px-3 disabled:bg-emerald-50"
                   />
                 </div>
               </div>
               
               <div className="flex justify-end gap-2 pt-2">
                 <button 
                    onClick={() => setShowSetup(false)}
                    disabled={isApplyingSetup}
                    className="text-emerald-700 font-medium text-xs px-3 py-2 disabled:opacity-50"
                 >
                   Batal
                 </button>
                 <button 
                    onClick={handleApplySetupAwal}
                    disabled={isApplyingSetup}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
                 >
                   {isApplyingSetup ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                   Simpan ke Database
                 </button>
               </div>
             </div>
          )}
        </div>
      )}

      {/* Form Setoran */}
      {selectedSantri?.tahapSantri === 'iqra' ? (
        <SetoranIqraForm
          santri={selectedSantri}
          onSubmit={handleCreateSetoranIqra}
        />
      ) : (
        <SetoranForm
          mode="create"
          santri={selectedSantri}
          onSubmit={handleCreateSetoran}
        />
      )}
    </div>
  )
}

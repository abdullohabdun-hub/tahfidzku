import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Check, ChevronDown, Loader2, Info } from 'lucide-react'
import { getSantriList, getLastSetoran, createSetoran } from '../../server-fns/ustadz'
import { getSurahByJuz, getAyatRangeInJuz, getTotalHalamanJuz, getNextAyat, SURAH_LIST, PAGES_DATA } from '../../lib/quranMapper'

export const Route = createFileRoute('/ustadz/input-setoran')({
  component: InputSetoranPage,
})

function InputSetoranPage() {
  // States
  const [santriList, setSantriList] = useState<any[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form States
  const [santriId, setSantriId] = useState('')
  const [jenisSetoran, setJenisSetoran] = useState<'ziyadah' | 'sabqi' | 'manzil'>('ziyadah')
  const [juz, setJuz] = useState<number>(30)
  
  // Ziyadah fields
  const [surahNama, setSurahNama] = useState('')
  const [ayatAwal, setAyatAwal] = useState<number | ''>('')
  const [ayatAkhir, setAyatAkhir] = useState<number | ''>('')
  
  // Sabqi/Manzil fields
  const [halamanAwal, setHalamanAwal] = useState<number | ''>('')
  const [halamanAkhir, setHalamanAkhir] = useState<number | ''>('')

  const [kualitas, setKualitas] = useState<'lancar' | 'mengulang' | 'terbata' | null>(null)
  const [catatan, setCatatan] = useState('')

  // Rekam Jejak Tracker
  const [rekamJejakInfo, setRekamJejakInfo] = useState<string | null>(null)

  // Options for Ziyadah
  const availableSurahs = getSurahByJuz(juz)
  const selectedSurah = SURAH_LIST.find(s => s.nama === surahNama)
  const ayatLimits = selectedSurah ? getAyatRangeInJuz(juz, selectedSurah.nomor) : null
  
  // Options for Sabqi/Manzil
  const totalHalamanJuz = getTotalHalamanJuz(juz)

  useEffect(() => {
    // Initial data fetch
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

  useEffect(() => {
    // Reset selected surah when Juz changes
    if (availableSurahs.length > 0 && !availableSurahs.some(s => s.nama === surahNama)) {
      setSurahNama(availableSurahs[0].nama)
    }
  }, [juz, availableSurahs])

  useEffect(() => {
    // Rekam Jejak Logic
    async function checkRekamJejak() {
      if (!santriId) return
      setRekamJejakInfo(null)
      try {
        const res = await getLastSetoran({ data: { santriId, jenis: jenisSetoran } })
        if (res.success && res.data) {
          const last = res.data
          
          if (jenisSetoran === 'ziyadah' && last.surah && last.ayatAkhir) {
             const surahData = SURAH_LIST.find(s => s.nama === last.surah)
             if (surahData) {
               const next = getNextAyat(surahData.nomor, last.ayatAkhir)
               if (next) {
                 setRekamJejakInfo(`Melanjutkan dari ${last.surah} ayat ${last.ayatAkhir}`)
                 // Auto-fill
                 setSurahNama(next.surahNama)
                 setAyatAwal(next.ayatAwal)
                 
                 // Try to figure out Juz based on next.surahNama and next.ayatAwal
                 const pageWithAyat = PAGES_DATA.find(p => p.surahs.some(s => s.nama === next.surahNama && s.ayatAwal <= next.ayatAwal && s.ayatAkhir >= next.ayatAwal))
                 if (pageWithAyat) setJuz(pageWithAyat.juz)
               }
             }
          } else if ((jenisSetoran === 'sabqi' || jenisSetoran === 'manzil') && last.juz && last.halamanAkhir) {
            setRekamJejakInfo(`Melanjutkan setelah Juz ${last.juz} Hal ${last.halamanAkhir}`)
            setJuz(last.juz)
            if (last.halamanAkhir < getTotalHalamanJuz(last.juz)) {
              setHalamanAwal(last.halamanAkhir + 1)
            } else {
              // Jika halaman sudah mentok di juz tersebut, bisa menyarankan pindah juz atau biarkan kosong
              setHalamanAwal('')
            }
          }
        }
      } catch (err) {
        console.error('Failed to get rekam jejak', err)
      }
    }
    checkRekamJejak()
  }, [santriId, jenisSetoran])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    
    if (!kualitas) {
      setErrorMsg('Pilih kualitas bacaan terlebih dahulu')
      return
    }

    if (jenisSetoran === 'ziyadah') {
      if (!surahNama || ayatAwal === '' || ayatAkhir === '') {
        setErrorMsg('Lengkapi data Surah dan Ayat')
        return
      }
      if (Number(ayatAkhir) < Number(ayatAwal)) {
        setErrorMsg('Ayat akhir tidak boleh lebih kecil dari ayat awal')
        return
      }
    } else {
      if (halamanAwal === '' || halamanAkhir === '') {
        setErrorMsg('Lengkapi data Halaman')
        return
      }
      if (Number(halamanAkhir) < Number(halamanAwal)) {
        setErrorMsg('Halaman akhir tidak boleh lebih kecil dari halaman awal')
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await createSetoran({
        data: {
          santriId,
          jenis: jenisSetoran,
          kualitas,
          juz,
          catatan,
          ...(jenisSetoran === 'ziyadah' 
            ? { surah: surahNama, ayatAwal: Number(ayatAwal), ayatAkhir: Number(ayatAkhir) }
            : { halamanAwal: Number(halamanAwal), halamanAkhir: Number(halamanAkhir) }
          )
        }
      })

      if (res.success) {
        setSuccessMsg('Setoran berhasil disimpan!')
        // Reset form partial
        setAyatAwal('')
        setAyatAkhir('')
        setHalamanAwal('')
        setHalamanAkhir('')
        setKualitas(null)
        setCatatan('')
        
        // Trigger reload rekam jejak by tricking the effect
        setJenisSetoran(jenisSetoran) 
      } else {
        setErrorMsg(res.error?.message || 'Gagal menyimpan setoran')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal terhubung ke server')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInitial) return (
    <div className="flex items-center justify-center p-12 text-emerald-600">
      <Loader2 className="animate-spin w-8 h-8" />
    </div>
  )

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Input Setoran</h2>
        <p className="text-slate-500 text-sm">Catat capaian hafalan santri hari ini</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl font-medium border border-emerald-100 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl font-medium border border-red-100">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Pemilihan Santri */}
        <section className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Pilih Santri</label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-white border border-slate-200 text-slate-900 font-medium text-lg rounded-xl px-4 py-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={santriId}
              onChange={(e) => setSantriId(e.target.value)}
            >
              {santriList.map(s => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </section>

        {/* 2. Jenis Setoran */}
        <section className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Jenis Setoran</label>
          <div className="grid grid-cols-3 gap-2">
            {(['ziyadah', 'sabqi', 'manzil'] as const).map((jenis) => (
              <button
                key={jenis}
                type="button"
                onClick={() => setJenisSetoran(jenis)}
                className={`py-3 px-2 rounded-xl font-medium transition-all text-sm capitalize ${
                  jenisSetoran === jenis 
                    ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 ring-offset-1" 
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {jenis}
              </button>
            ))}
          </div>
        </section>

        {/* Rekam Jejak Info */}
        {rekamJejakInfo && (
          <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p><strong>Rekam Jejak:</strong> {rekamJejakInfo}. Kolom telah diisi otomatis untuk memudahkan Anda.</p>
          </div>
        )}

        {/* 3. Input Capaian */}
        <section className="space-y-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-lg border-b border-slate-100 pb-2">Target Capaian</h3>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Juz</label>
            <div className="relative">
              <select 
                value={juz}
                onChange={(e) => setJuz(Number(e.target.value))}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {/* Menggunakan opsi mundur seperti request user: mulai dari juz 30, 29, dst */}
                {[...Array(30)].map((_, i) => {
                  const j = 30 - i
                  return <option key={j} value={j}>Juz {j}</option>
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {jenisSetoran === 'ziyadah' ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Surah (Dalam Juz {juz})</label>
                <div className="relative">
                  <select 
                    value={surahNama}
                    onChange={(e) => setSurahNama(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {availableSurahs.map(s => (
                      <option key={s.nomor} value={s.nama}>{s.nomor}. {s.nama}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ayat Awal</label>
                  <input 
                    type="number" 
                    value={ayatAwal}
                    onChange={(e) => setAyatAwal(e.target.value ? Number(e.target.value) : '')}
                    min={ayatLimits?.ayatAwal || 1}
                    max={ayatLimits?.ayatAkhir || 286}
                    placeholder="Contoh: 1"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {ayatLimits && <p className="text-[10px] text-slate-400 mt-1">Dalam Juz {juz}: Ayat {ayatLimits.ayatAwal}-{ayatLimits.ayatAkhir}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ayat Akhir</label>
                  <input 
                    type="number" 
                    value={ayatAkhir}
                    onChange={(e) => setAyatAkhir(e.target.value ? Number(e.target.value) : '')}
                    min={ayatAwal || 1}
                    max={ayatLimits?.ayatAkhir || 286}
                    placeholder="Contoh: 5"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Halaman Awal</label>
                  <input 
                    type="number" 
                    value={halamanAwal}
                    onChange={(e) => setHalamanAwal(e.target.value ? Number(e.target.value) : '')}
                    min={1}
                    max={totalHalamanJuz}
                    placeholder="Halaman 1"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Max Halaman: {totalHalamanJuz}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Halaman Akhir</label>
                  <input 
                    type="number" 
                    value={halamanAkhir}
                    onChange={(e) => setHalamanAkhir(e.target.value ? Number(e.target.value) : '')}
                    min={halamanAwal || 1}
                    max={totalHalamanJuz}
                    placeholder="Halaman 2"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
            </div>
          )}
        </section>

        {/* 4. Kualitas Bacaan */}
        <section className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Kualitas Bacaan</label>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setKualitas("lancar")}
              className={`flex items-center justify-between py-4 px-5 rounded-xl font-medium border-2 transition-all ${
                kualitas === "lancar" 
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
              }`}
            >
              <span>🟢 Lancar (Mumtaz)</span>
              {kualitas === "lancar" && <Check className="w-5 h-5 text-emerald-600" />}
            </button>
            
            <button
              type="button"
              onClick={() => setKualitas("mengulang")}
              className={`flex items-center justify-between py-4 px-5 rounded-xl font-medium border-2 transition-all ${
                kualitas === "mengulang" 
                  ? "border-amber-500 bg-amber-50 text-amber-700" 
                  : "border-slate-200 bg-white text-slate-600 hover:border-amber-200"
              }`}
            >
              <span>🟡 Mengulang (Jayyid)</span>
              {kualitas === "mengulang" && <Check className="w-5 h-5 text-amber-600" />}
            </button>

            <button
              type="button"
              onClick={() => setKualitas("terbata")}
              className={`flex items-center justify-between py-4 px-5 rounded-xl font-medium border-2 transition-all ${
                kualitas === "terbata" 
                  ? "border-red-500 bg-red-50 text-red-700" 
                  : "border-slate-200 bg-white text-slate-600 hover:border-red-200"
              }`}
            >
              <span>🔴 Terbata-bata (Maqbul)</span>
              {kualitas === "terbata" && <Check className="w-5 h-5 text-red-600" />}
            </button>
          </div>
        </section>

        {/* 5. Catatan */}
        <section className="space-y-2 pb-6">
          <label className="text-sm font-semibold text-slate-700">Catatan Tajwid/Makhraj (Opsional)</label>
          <textarea 
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tuliskan jika ada koreksi tajwid..."
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          ></textarea>
        </section>

        {/* 6. Tombol Simpan */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40 max-w-lg mx-auto">
          <button 
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-emerald-600/30 disabled:opacity-70 transition-all"
          >
            {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : null}
            Simpan Setoran
          </button>
        </div>

      </form>
    </div>
  )
}

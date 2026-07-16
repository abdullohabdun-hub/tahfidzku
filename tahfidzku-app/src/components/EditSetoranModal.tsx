import { useState, useEffect, useMemo } from 'react'
import {
  buatSurahMetaOtomatis,
  buatSurahMetaLintasJuz,
  terapkanOverrideAyat,
  parseHalamanPecahan,
  SURAH_LIST,
  JUZ_TABLE
} from '../lib/quranMapper'
import { CheckCircle2, Loader2, Save, X } from 'lucide-react'

export function EditSetoranModal({ 
  isOpen, 
  onClose, 
  initialData,
  onSave, 
  isUstadz 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  initialData: any, 
  onSave: (payload: any) => Promise<any>,
  isUstadz: boolean 
}) {
  const [jenis, setJenis] = useState(initialData?.jenis || 'ziyadah')
  
  // Ziyadah fields
  const [surahNomor, setSurahNomor] = useState(initialData?.surahMeta?.label ? SURAH_LIST.find(s => s.nama === initialData.surahMeta.label.split(' ')[0])?.nomor || 1 : 1)
  const [ayatAwal, setAyatAwal] = useState(initialData?.ayatAwal || 1)
  const [ayatAkhir, setAyatAkhir] = useState(initialData?.ayatAkhir || 1)

  // Sabqi/Manzil fields
  const [lintasJuz, setLintasJuz] = useState(initialData?.lintasJuz || false)
  const [juz, setJuz] = useState(initialData?.juzMulai || initialData?.juz || 1)
  const [juzMulai, setJuzMulai] = useState(initialData?.juzMulai || 1)
  const [juzSelesai, setJuzSelesai] = useState(initialData?.juzSelesai || 1)
  const [halMulai, setHalMulai] = useState(String(initialData?.halamanAwal || 1))
  const [halSelesai, setHalSelesai] = useState(String(initialData?.halamanAkhir || 1))
  
  // Common
  const [kualitas, setKualitas] = useState(initialData?.kualitas || 'lancar')
  const [catatan, setCatatan] = useState(initialData?.catatan || '')
  
  // Meta
  const [metaInfo, setMetaInfo] = useState<any>(initialData?.surahMeta || null)
  const [parseError, setParseError] = useState<any>({})

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Re-initialize when initialData changes
  useEffect(() => {
    if (initialData) {
      setJenis(initialData.jenis)
      setKualitas(initialData.kualitas)
      setCatatan(initialData.catatan || '')

      if (initialData.jenis === 'ziyadah') {
        const surah = SURAH_LIST.find(s => s.nama === initialData.surah)
        if (surah) setSurahNomor(surah.nomor)
        setAyatAwal(initialData.ayatAwal || 1)
        setAyatAkhir(initialData.ayatAkhir || 1)
      } else {
        setLintasJuz(initialData.lintasJuz)
        setJuz(initialData.juzMulai || initialData.juz || 1)
        setJuzMulai(initialData.juzMulai || 1)
        setJuzSelesai(initialData.juzSelesai || 1)
        setHalMulai(String(initialData.halamanAwal || 1))
        setHalSelesai(String(initialData.halamanAkhir || 1))
      }
    }
  }, [initialData])

  // Sabqi/Manzil Meta calculation
  useEffect(() => {
    if (jenis === 'ziyadah') return
    try {
      let awalParsed, akhirParsed;
      let pErr: any = {};
      try { awalParsed = parseHalamanPecahan(halMulai); } catch(e: any) { pErr.mulai = e.message; }
      try { akhirParsed = parseHalamanPecahan(halSelesai); } catch(e: any) { pErr.selesai = e.message; }
      
      setParseError(pErr);

      if (!awalParsed || !akhirParsed) {
        setMetaInfo(null);
        return;
      }

      let metaAuto = null;
      if (!lintasJuz) {
        if (awalParsed.halaman <= akhirParsed.halaman) {
          metaAuto = buatSurahMetaOtomatis(juz, awalParsed.halaman, juz, akhirParsed.halaman)
        }
      } else {
        if (juzMulai < juzSelesai) {
          metaAuto = buatSurahMetaLintasJuz(juzMulai, awalParsed.halaman, juzSelesai, akhirParsed.halaman)
        }
      }
      
      // Simplify logic for MVP Edit: We ignore precision overrides for Edit to keep it simple.
      // If user wants precision, they must delete and recreate.
      if (metaAuto) {
        setMetaInfo(metaAuto)
      } else {
        setMetaInfo(null)
      }
    } catch (e) {
      setMetaInfo(null)
    }
  }, [jenis, lintasJuz, juz, juzMulai, juzSelesai, halMulai, halSelesai])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      let payload: any = {
        id: initialData.id,
        jenis,
        kualitas,
        catatan,
      }

      if (isUstadz) {
        payload.santriId = initialData.santriId
      }

      if (jenis === 'ziyadah') {
        const surah = SURAH_LIST.find(s => s.nomor === surahNomor)
        payload.surah = surah?.nama
        payload.surahNomor = surahNomor
        payload.ayatAwal = ayatAwal
        payload.ayatAkhir = ayatAkhir
        
        // Buat surahMeta simple untuk ziyadah
        payload.surahMeta = {
          label: `${surah?.nama} ${ayatAwal}-${ayatAkhir}`,
          meta: [{ surahMulai: { nomor: surahNomor, ayat: ayatAwal, nama: surah?.nama }, surahSelesai: { nomor: surahNomor, ayat: ayatAkhir, nama: surah?.nama } }]
        }
      } else {
        if (!metaInfo) throw new Error('Data rentang halaman tidak valid')
        payload.lintasJuz = lintasJuz
        if (lintasJuz) {
          payload.juzMulai = juzMulai
          payload.juzSelesai = juzSelesai
        } else {
          payload.juzMulai = juz
          payload.juzSelesai = juz
        }
        
        const awalParsed = parseHalamanPecahan(halMulai)
        const akhirParsed = parseHalamanPecahan(halSelesai)
        
        payload.halamanAwal = awalParsed.halaman + awalParsed.pecahan
        payload.halamanAkhir = akhirParsed.halaman + akhirParsed.pecahan
        payload.surahMeta = metaInfo
      }

      const res = await onSave(payload)
      if (res.success) {
        onClose()
      } else {
        setErrorMsg(res.error?.message || 'Gagal menyimpan perubahan')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-800">Edit Setoran</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Jenis (READ-ONLY) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jenis Setoran</label>
              <input 
                type="text" 
                value={jenis.toUpperCase()} 
                disabled 
                className="w-full p-3 bg-slate-100 text-slate-500 rounded-xl border border-slate-200 font-medium cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Jenis setoran tidak dapat diubah pada mode edit.</p>
            </div>

            {/* Ziyadah Form */}
            {jenis === 'ziyadah' && (
              <div className="space-y-4 p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Surah</label>
                  <select 
                    value={surahNomor}
                    onChange={(e) => setSurahNomor(Number(e.target.value))}
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  >
                    {SURAH_LIST.map(s => (
                      <option key={s.nomor} value={s.nomor}>{s.nomor}. {s.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ayat Awal</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={ayatAwal} 
                      onChange={e => setAyatAwal(Number(e.target.value))}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ayat Akhir</label>
                    <input 
                      type="number" 
                      min={ayatAwal} 
                      value={ayatAkhir} 
                      onChange={e => setAyatAkhir(Number(e.target.value))}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sabqi/Manzil Form */}
            {(jenis === 'sabqi' || jenis === 'manzil') && (
              <div className={`space-y-4 p-4 border rounded-xl ${jenis === 'sabqi' ? 'bg-blue-50/50 border-blue-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <input type="checkbox" checked={lintasJuz} onChange={e => setLintasJuz(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                    Lintas Juz
                  </label>
                </div>

                {!lintasJuz ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Juz</label>
                    <input type="number" min="1" max="30" value={juz} onChange={e => setJuz(Number(e.target.value))} className="w-full p-3 bg-white rounded-xl border border-slate-200" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Juz Mulai</label>
                      <input type="number" min="1" max="30" value={juzMulai} onChange={e => setJuzMulai(Number(e.target.value))} className="w-full p-3 bg-white rounded-xl border border-slate-200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Juz Selesai</label>
                      <input type="number" min={juzMulai} max="30" value={juzSelesai} onChange={e => setJuzSelesai(Number(e.target.value))} className="w-full p-3 bg-white rounded-xl border border-slate-200" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Halaman Mulai</label>
                    <input type="text" value={halMulai} onChange={e => setHalMulai(e.target.value)} placeholder="Contoh: 12.5" className={`w-full p-3 bg-white rounded-xl border ${parseError.mulai ? 'border-red-300' : 'border-slate-200'}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Halaman Selesai</label>
                    <input type="text" value={halSelesai} onChange={e => setHalSelesai(e.target.value)} placeholder="Contoh: 14" className={`w-full p-3 bg-white rounded-xl border ${parseError.selesai ? 'border-red-300' : 'border-slate-200'}`} />
                  </div>
                </div>

                {metaInfo && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 mt-2">
                    <p className="text-sm font-bold text-slate-800">{metaInfo.label}</p>
                    <p className="text-xs text-slate-500">{metaInfo.title}</p>
                  </div>
                )}
              </div>
            )}

            {/* Kualitas & Catatan */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kualitas Hafalan</label>
              <select 
                value={kualitas}
                onChange={e => setKualitas(e.target.value)}
                className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="lancar">Lancar (Kuat)</option>
                <option value="mengulang">Mengulang (Ragu/Lupa)</option>
                <option value="terbata">Terbata (Belum Lancar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan Tambahan</label>
              <textarea 
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Tulis pesan/catatan..."
                rows={3}
                className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-200 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (jenis !== 'ziyadah' && !metaInfo)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white p-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

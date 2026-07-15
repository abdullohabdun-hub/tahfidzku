import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Loader2, Info, ArrowLeft } from 'lucide-react'
import { inputMurojaah } from '../../server-fns/setoran'
import { getSantriProfile } from '../../server-fns/santri'
import { Button } from '../../components/ui/button'
import { 
  buatSurahMetaOtomatis, 
  buatSurahMetaLintasJuz, 
  surahByNomor, 
  JUZ_TABLE,
  parseHalamanPecahan,
  terapkanOverrideAyat,
  urutanJuzStandar,
  cariJuzUntukAyat
} from '../../lib/quranMapper'

export const Route = createFileRoute('/santri/input')({
  component: SantriInputMurojaah,
})

// === Styles & Tokens ===
const ACCENTS = {
  amber: {
    text: "text-amber-700",
    solidBg: "bg-amber-500",
    solidBgHover: "hover:bg-amber-600",
    softBg: "bg-amber-50",
    border: "border-amber-200",
    ring: "focus:ring-amber-500 focus:border-amber-500",
    dot: "bg-amber-500",
    chipBg: "bg-amber-100",
    chipText: "text-amber-800",
  },
  indigo: {
    text: "text-indigo-700",
    solidBg: "bg-indigo-600",
    solidBgHover: "hover:bg-indigo-700",
    softBg: "bg-indigo-50",
    border: "border-indigo-200",
    ring: "focus:ring-indigo-500 focus:border-indigo-500",
    dot: "bg-indigo-500",
    chipBg: "bg-indigo-100",
    chipText: "text-indigo-800",
  },
}

const JENIS_TABS = [
  { id: 'sabqi', label: 'Sabqi', desc: 'Ulang Hafalan Baru', accent: 'amber' },
  { id: 'manzil', label: 'Manzil', desc: 'Ulang Hafalan Lama', accent: 'indigo' }
]

const KUALITAS_OPTIONS = [
  { id: 'lancar', label: 'Lancar', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { id: 'mengulang', label: 'Mengulang', color: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { id: 'terbata', label: 'Terbata', color: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' }
]

const SURAH_LIST = Object.values(surahByNomor).sort((a: any, b: any) => a.nomor - b.nomor)

// === Components ===
function SectionLabel({ accent, children }: { accent: keyof typeof ACCENTS, children: React.ReactNode }) {
  const a = ACCENTS[accent];
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
      <span className={`text-[11px] font-bold tracking-widest uppercase ${a.text}`}>{children}</span>
    </div>
  );
}

function PreviewBox({ accent, meta, note }: { accent: keyof typeof ACCENTS, meta: any, note?: string }) {
  const a = ACCENTS[accent];
  if (!meta) return null;
  return (
    <div className={`mt-4 rounded-xl ${a.softBg} border ${a.border} px-4 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Terbaca sistem</p>
          <p className={`text-sm font-semibold ${a.text}`}>{meta.label}</p>
        </div>
      </div>
      {(meta.lintasJuz || note || meta.presisiManual) && (
        <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50">
          {meta.lintasJuz ? `Lintas juz ${meta.juzMulai} → ${meta.juzSelesai}. ` : ""}
          {meta.presisiManual ? `(Dikoreksi presisi manual) ` : ""}
          {note}
        </p>
      )}
    </div>
  );
}

function SantriInputMurojaah() {
  const navigate = useNavigate()
  
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [profile, setProfile] = useState<any>(null)
  
  // State Utama
  const [jenisSetoran, setJenisSetoran] = useState<'sabqi' | 'manzil'>('sabqi')
  const activeAccent = JENIS_TABS.find(t => t.id === jenisSetoran)?.accent as keyof typeof ACCENTS || 'amber'
  
  // Sabqi / Manzil State
  const [lintasJuz, setLintasJuz] = useState(false)
  
  // -- Standar (Tidak lintas juz)
  const [juz, setJuz] = useState<number>(30)
  const [halamanAwal, setHalamanAwal] = useState<string>('1')
  const [halamanAkhir, setHalamanAkhir] = useState<string>('1')
  
  // -- Lintas Juz
  const [juzMulai, setJuzMulai] = useState<number>(29)
  const [juzSelesai, setJuzSelesai] = useState<number>(30)
  const [halMulai, setHalMulai] = useState<string>('1')
  const [halSelesai, setHalSelesai] = useState<string>('1')

  // Presisi Manual
  const [showPresisi, setShowPresisi] = useState(false)
  const [presisiDisentuhManual, setPresisiDisentuhManual] = useState(false)
  const [overrideAwal, setOverrideAwal] = useState<any>(null)
  const [overrideAkhir, setOverrideAkhir] = useState<any>(null)

  // Hasil Meta Sabqi/Manzil
  const [metaInfo, setMetaInfo] = useState<any>(null)
  const [parseError, setParseError] = useState<{mulai?: string, selesai?: string}>({})

  const [kualitas, setKualitas] = useState<'lancar' | 'mengulang' | 'terbata' | null>(null)
  const [catatan, setCatatan] = useState('')

  useEffect(() => {
    async function init() {
      try {
        const res = await getSantriProfile()
        if (res.success && res.data) {
          setProfile(res.data)
        } else {
          setErrorMsg('Gagal memuat profil: ' + res.error?.message)
        }
      } catch (err) {
        setErrorMsg('Terjadi kesalahan memuat data')
      } finally {
        setLoadingInitial(false)
      }
    }
    init()
  }, [])

  // Menentukan Valid Juz (Hanya yang sudah dihafal)
  const validJuzList = useMemo(() => {
    if (!profile) return []
    const urutan = profile.urutanHafalan || urutanJuzStandar()
    let passedJuzList = [...(profile.juzProgress || [])]
    
    if (profile.posisiTerakhir) {
      const curJuz = cariJuzUntukAyat(profile.posisiTerakhir.surahNomor, profile.posisiTerakhir.ayat)
      const currentIndex = urutan.indexOf(curJuz)
      
      if (currentIndex !== -1) {
        for (let i = 0; i <= currentIndex; i++) {
          if (!passedJuzList.includes(urutan[i])) {
            passedJuzList.push(urutan[i])
          }
        }
      }
    }
    
    // Fallback: Jika kosong, boleh juz 30 agar UI tidak crash, tapi submit mungkin gagal.
    // Idealnya santri yang belum menghafal tidak bisa lapor murojaah.
    if (passedJuzList.length === 0) return [30]
    return passedJuzList
  }, [profile])
  
  // Set nilai awal Juz ketika profile termuat
  useEffect(() => {
    if (validJuzList.length > 0) {
      const defJuz = validJuzList[0]
      if (!validJuzList.includes(juz)) setJuz(defJuz)
      if (!validJuzList.includes(juzMulai)) setJuzMulai(defJuz)
      if (!validJuzList.includes(juzSelesai)) setJuzSelesai(defJuz)
    }
  }, [validJuzList])

  // Auto kalkulasi meta Sabqi/Manzil
  useEffect(() => {
    try {
      let awalParsed, akhirParsed;
      let pErr: any = {};
      try { awalParsed = parseHalamanPecahan(lintasJuz ? halMulai : halamanAwal); } catch(e: any) { pErr.mulai = e.message; }
      try { akhirParsed = parseHalamanPecahan(lintasJuz ? halSelesai : halamanAkhir); } catch(e: any) { pErr.selesai = e.message; }
      
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
      
      const halamanTidakPenuh = (awalParsed.pecahan > 0) || (akhirParsed.pecahan > 0);
      
      if (halamanTidakPenuh && metaAuto && !showPresisi && !presisiDisentuhManual) {
        setOverrideAwal({ surahNomor: metaAuto.surahMulai.nomor, ayat: metaAuto.surahMulai.ayat })
        setOverrideAkhir({ surahNomor: metaAuto.surahSelesai.nomor, ayat: metaAuto.surahSelesai.ayat })
        setShowPresisi(true)
      }

      if (metaAuto) {
        setMetaInfo(terapkanOverrideAyat(metaAuto, overrideAwal, overrideAkhir))
      } else {
        setMetaInfo(null)
      }
    } catch (e) {
      setMetaInfo(null)
    }
  }, [lintasJuz, juz, halamanAwal, halamanAkhir, juzMulai, juzSelesai, halMulai, halSelesai, overrideAwal, overrideAkhir, showPresisi, presisiDisentuhManual])

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!kualitas) return setErrorMsg('Pilih kualitas hafalan terlebih dahulu')
    if (!metaInfo) return setErrorMsg('Data rentang halaman belum valid')

    // Verifikasi backend protection (hanya juz valid)
    if (!lintasJuz && !validJuzList.includes(juz)) return setErrorMsg(`Juz ${juz} belum ada di riwayat hafalanmu.`)
    if (lintasJuz && (!validJuzList.includes(juzMulai) || !validJuzList.includes(juzSelesai))) {
       return setErrorMsg('Rentang lintas juz memuat juz yang belum dihafal.')
    }

    setSubmitting(true)

    try {
      let payload: any = {
        jenis: jenisSetoran,
        kualitas,
        catatan,
      }

      if (lintasJuz) {
          payload.lintasJuz = true
          payload.juzMulai = juzMulai
          payload.juzSelesai = juzSelesai
          payload.halamanAwal = Number(halMulai.replace(',','.'))
          payload.halamanAkhir = Number(halSelesai.replace(',','.'))
      } else {
          payload.lintasJuz = false
          payload.juzMulai = juz
          payload.juzSelesai = juz
          payload.halamanAwal = Number(halamanAwal.replace(',','.'))
          payload.halamanAkhir = Number(halamanAkhir.replace(',','.'))
      }
      
      payload.surahMeta = metaInfo

      const res = await inputMurojaah({ data: payload })
      if (res.success) {
        setSuccessMsg('Murojaah berhasil dilaporkan!')
        setCatatan('')
        setKualitas(null)
        setTimeout(() => navigate({ to: '/santri' }), 1500)
      } else {
        setErrorMsg(res.error?.message || 'Terjadi kesalahan saat melapor')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan murojaah')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="pb-8 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3 bg-white p-4 sticky top-0 z-20 border-b border-slate-100 mb-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <h1 className="text-xl font-bold text-slate-800">Lapor Murojaah</h1>
      </div>

      <div className="px-4">
        {/* Pesan Informatif */}
        <div className="bg-slate-800 p-4 rounded-xl text-white mb-6 shadow-sm">
          <h2 className="font-bold text-sm mb-1">Input Hafalan Mandiri</h2>
          <p className="text-xs opacity-80 leading-relaxed">
            Hanya juz yang sudah kamu hafal (Ziyadah) yang bisa dilaporkan sebagai Sabqi / Manzil.
          </p>
        </div>

        {/* Tabs Jenis Setoran */}
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex gap-1 shadow-sm mb-5">
          {JENIS_TABS.map((tab) => {
            const isActive = jenisSetoran === tab.id;
            const a = ACCENTS[tab.accent as keyof typeof ACCENTS];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setJenisSetoran(tab.id as any);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                  isActive ? `${a.softBg} ${a.text} shadow-sm border ${a.border}` : "text-slate-500 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <span className={`text-sm font-bold ${isActive ? a.text : ""}`}>{tab.label}</span>
                <span className="text-[10px] opacity-70">{tab.desc}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* PANEL SABQI / MANZIL */}
          <div className={`bg-white rounded-xl border ${ACCENTS[activeAccent].border} p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel accent={activeAccent}>Rentang Bacaan</SectionLabel>
              
              <button
                type="button"
                onClick={() => setLintasJuz(!lintasJuz)}
                className="flex items-center gap-2 select-none"
              >
                <span className="text-[10px] font-semibold text-slate-500">LINTAS JUZ</span>
                <span className={`h-4 w-7 rounded-full transition-colors relative shrink-0 ${lintasJuz ? ACCENTS[activeAccent].solidBg : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${lintasJuz ? "translate-x-3.5" : "translate-x-0.5"}`} />
                </span>
              </button>
            </div>

            {!lintasJuz ? (
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs text-slate-500 mb-1.5">Juz</label>
                  <select
                    value={juz}
                    onChange={(e) => {
                      const newJuz = Number(e.target.value)
                      setJuz(newJuz)
                      setHalamanAwal('1')
                      setHalamanAkhir('1')
                    }}
                    className={`w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                  >
                    {JUZ_TABLE.filter(j => validJuzList.includes(j.juz)).map(j => (
                      <option key={j.juz} value={j.juz}>Juz {j.juz} ({j.halamanAkhir - j.halamanAwal + 1} Halaman)</option>
                    ))}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 bottom-3 pointer-events-none" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1.5">Hal. Mulai</label>
                    <input 
                      type="text" inputMode="decimal"
                      value={halamanAwal} onChange={e => setHalamanAwal(e.target.value)}
                      placeholder="mis. 1,5"
                      className={`w-full rounded-lg border ${parseError.mulai ? 'border-red-400' : 'border-slate-300'} px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    />
                    {parseError.mulai && <p className="text-[10px] text-red-500 mt-1">{parseError.mulai}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1.5">Hal. Selesai</label>
                    <input 
                      type="text" inputMode="decimal"
                      value={halamanAkhir} onChange={e => setHalamanAkhir(e.target.value)}
                      placeholder="mis. 2,5"
                      className={`w-full rounded-lg border ${parseError.selesai ? 'border-red-400' : 'border-slate-300'} px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    />
                    {parseError.selesai && <p className="text-[10px] text-red-500 mt-1">{parseError.selesai}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Titik Mulai</p>
                  </div>
                  <div className="relative">
                    <select
                      value={juzMulai}
                      onChange={(e) => {
                        setJuzMulai(Number(e.target.value))
                        setHalMulai('1')
                      }}
                      className={`w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm pr-6 focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    >
                      {JUZ_TABLE.filter(j => j.juz < 30 && validJuzList.includes(j.juz)).map(j => (
                        <option key={j.juz} value={j.juz}>Juz {j.juz}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input 
                      type="text" inputMode="decimal"
                      value={halMulai} onChange={e => setHalMulai(e.target.value)}
                      placeholder="mis. 1,5"
                      className={`w-full rounded-lg border ${parseError.mulai ? 'border-red-400' : 'border-slate-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    />
                    {parseError.mulai && <p className="text-[10px] text-red-500 mt-1 leading-tight">{parseError.mulai}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Titik Selesai</p>
                  </div>
                  <div className="relative">
                    <select
                      value={juzSelesai}
                      onChange={(e) => {
                        setJuzSelesai(Number(e.target.value))
                        setHalSelesai('1')
                      }}
                      className={`w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm pr-6 focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    >
                      {JUZ_TABLE.filter(j => j.juz > juzMulai && validJuzList.includes(j.juz)).map(j => (
                        <option key={j.juz} value={j.juz}>Juz {j.juz}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input 
                      type="text" inputMode="decimal"
                      value={halSelesai} onChange={e => setHalSelesai(e.target.value)}
                      placeholder="mis. 2,5"
                      className={`w-full rounded-lg border ${parseError.selesai ? 'border-red-400' : 'border-slate-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    />
                    {parseError.selesai && <p className="text-[10px] text-red-500 mt-1 leading-tight">{parseError.selesai}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Presisi Ayat (Otomatis Terbuka jika ada Pecahan) */}
            {showPresisi && (
              <div className={`mt-4 p-4 rounded-xl border ${ACCENTS[activeAccent].border} ${ACCENTS[activeAccent].softBg}`}>
                 <div className="flex justify-between items-center mb-3">
                   <p className={`text-xs font-bold uppercase tracking-wider ${ACCENTS[activeAccent].text}`}>Koreksi Ayat Manual</p>
                   <button 
                     type="button"
                     onClick={() => {
                       setShowPresisi(false)
                       setOverrideAwal(null)
                       setOverrideAkhir(null)
                       setPresisiDisentuhManual(true)
                     }}
                     className="text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                   >
                     TUTUP
                   </button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mulai Presisi</label>
                     <select 
                       value={overrideAwal?.surahNomor || ''} 
                       onChange={e => setOverrideAwal({...overrideAwal, surahNomor: Number(e.target.value)})}
                       className="w-full mb-2 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-400"
                     >
                       {SURAH_LIST.map((s: any) => <option key={s.nomor} value={s.nomor}>{s.nama}</option>)}
                     </select>
                     <input 
                       type="number" min={1} placeholder="Ayat Awal"
                       value={overrideAwal?.ayat || ''}
                       onChange={e => setOverrideAwal({...overrideAwal, ayat: Number(e.target.value)})}
                       className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-400"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Selesai Presisi</label>
                     <select 
                       value={overrideAkhir?.surahNomor || ''} 
                       onChange={e => setOverrideAkhir({...overrideAkhir, surahNomor: Number(e.target.value)})}
                       className="w-full mb-2 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-400"
                     >
                       {SURAH_LIST.map((s: any) => <option key={s.nomor} value={s.nomor}>{s.nama}</option>)}
                     </select>
                     <input 
                       type="number" min={1} placeholder="Ayat Akhir"
                       value={overrideAkhir?.ayat || ''}
                       onChange={e => setOverrideAkhir({...overrideAkhir, ayat: Number(e.target.value)})}
                       className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-400"
                     />
                   </div>
                 </div>
              </div>
            )}
            
            {(!showPresisi && metaInfo) && (
              <button 
                type="button" 
                onClick={() => {
                   setShowPresisi(true)
                   setPresisiDisentuhManual(true)
                   setOverrideAwal({ surahNomor: metaInfo.surahMulai.nomor, ayat: metaInfo.surahMulai.ayat })
                   setOverrideAkhir({ surahNomor: metaInfo.surahSelesai.nomor, ayat: metaInfo.surahSelesai.ayat })
                }}
                className="mt-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
              >
                + KOREKSI PRESISI AYAT MANUAL
              </button>
            )}

            <PreviewBox accent={activeAccent} meta={metaInfo} />
          </div>

          {/* 3. Kualitas & Catatan */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
            <SectionLabel accent={activeAccent}>Penilaian Diri (Muhasabah)</SectionLabel>
            
            <div className="grid grid-cols-3 gap-2">
              {KUALITAS_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setKualitas(opt.id as any)}
                  className={`py-2 px-1 rounded-lg border text-[11px] font-bold tracking-tight transition-all
                    ${kualitas === opt.id 
                      ? `${opt.color} ring-2 ring-offset-1 ring-${opt.color.split('-')[1]}-400` 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan / Kendala (Opsional)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Kesulitan di halaman sekian, butuh diulangi lagi..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[80px]"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" /> {successMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !metaInfo}
            className={`w-full py-3.5 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${ACCENTS[activeAccent].solidBg} ${ACCENTS[activeAccent].solidBgHover}`}
          >
            {submitting ? (
               <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim Laporan...</>
            ) : (
              <><Check className="w-5 h-5" /> Kirim Laporan Murojaah</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

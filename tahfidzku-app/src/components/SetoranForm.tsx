import React, { useState, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Loader2, Info, Settings2 } from 'lucide-react'
import {
  buatSurahMetaOtomatis,
  buatSurahMetaLintasJuz,
  prefillZiyadahBerikutnya,
  surahByNomor,
  JUZ_TABLE,
  parseHalamanPecahan,
  terapkanOverrideAyat,
  labelRentangAyatZiyadah,
  urutanJuzStandar,
} from '../lib/quranMapper'

// === Styles & Tokens ===
const ACCENTS = {
  emerald: {
    text: "text-emerald-700",
    solidBg: "bg-emerald-600",
    solidBgHover: "hover:bg-emerald-700",
    softBg: "bg-emerald-50",
    border: "border-emerald-200",
    ring: "focus:ring-emerald-500 focus:border-emerald-500",
    dot: "bg-emerald-500",
    chipBg: "bg-emerald-100",
    chipText: "text-emerald-800",
  },
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
  { id: 'ziyadah', label: 'Ziyadah', desc: 'Hafalan Baru', accent: 'emerald' },
  { id: 'sabqi', label: 'Sabqi', desc: 'Ulang Hafalan Baru', accent: 'amber' },
  { id: 'manzil', label: 'Manzil', desc: 'Ulang Hafalan Lama', accent: 'indigo' }
]

const KUALITAS_OPTIONS = [
  { id: 'lancar', label: 'Lancar', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { id: 'mengulang', label: 'Mengulang', color: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { id: 'terbata', label: 'Terbata', color: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' }
]

const SURAH_LIST = Object.values(surahByNomor).sort((a: any, b: any) => a.nomor - b.nomor)

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

interface SetoranFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  santri?: any;
  defaultJenis?: 'ziyadah' | 'sabqi' | 'manzil';
  onSubmit: (payload: any) => Promise<{ success: boolean; error?: any }>;
  onCancel?: () => void;
  isUstadz?: boolean;
}

export function SetoranForm({ mode, initialData, santri, defaultJenis, onSubmit, onCancel, isUstadz = true }: SetoranFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // State Utama
  const [jenisSetoran, setJenisSetoran] = useState<'ziyadah' | 'sabqi' | 'manzil'>(defaultJenis || 'ziyadah')
  const activeAccent = JENIS_TABS.find(t => t.id === jenisSetoran)?.accent as keyof typeof ACCENTS || 'emerald'
  
  const urutanHafalan = useMemo(() => santri?.urutanHafalan ?? urutanJuzStandar(), [santri])

  // Ziyadah State
  const [surahSelesaiNomor, setSurahSelesaiNomor] = useState<number>(0)
  const [ayatSelesai, setAyatSelesai] = useState<number | ''>('')
  
  // Ziyadah Read-only state untuk mode edit
  const [editSurahMulaiNomor, setEditSurahMulaiNomor] = useState<number>(0)
  const [editAyatMulai, setEditAyatMulai] = useState<number>(0)

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

  // INISIALISASI DATA
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setJenisSetoran(initialData.jenis)
      setKualitas(initialData.kualitas)
      setCatatan(initialData.catatan || '')

      if (initialData.jenis === 'ziyadah') {
        const surah = Object.values(surahByNomor).find((s: any) => s.nama === initialData.surah)
        const surahMulaiNo = initialData.surahNomor || surah?.nomor || 1;
        setEditSurahMulaiNomor(surahMulaiNo)
        setEditAyatMulai(initialData.ayatAwal || 1)
        setAyatSelesai(initialData.ayatAkhir || 1)
        
        let surahSelesaiNo = surahMulaiNo;
        if (initialData.surahMeta?.meta?.[0]?.surahSelesai?.nomor) {
           surahSelesaiNo = initialData.surahMeta.meta[0].surahSelesai.nomor;
        } else if (initialData.surahMeta?.label && initialData.surahMeta.label.includes('-')) {
            const secondPart = initialData.surahMeta.label.split('-')[1];
            for (const s of Object.values(surahByNomor) as any[]) {
                if (secondPart.toLowerCase().includes(s.nama.toLowerCase())) {
                    surahSelesaiNo = s.nomor;
                    break;
                }
            }
        }
        setSurahSelesaiNomor(surahSelesaiNo)
      } else {
        setLintasJuz(initialData.lintasJuz || false)
        if (initialData.lintasJuz) {
            setJuzMulai(initialData.juzMulai || 1)
            setJuzSelesai(initialData.juzSelesai || 1)
            setHalMulai(String(initialData.halamanAwal || 1).replace('.', ','))
            setHalSelesai(String(initialData.halamanAkhir || 1).replace('.', ','))
        } else {
            setJuz(initialData.juzMulai || initialData.juz || 1)
            setHalamanAwal(String(initialData.halamanAwal || 1).replace('.', ','))
            setHalamanAkhir(String(initialData.halamanAkhir || 1).replace('.', ','))
        }
        
        if (initialData.surahMeta?.presisiManual) {
            setPresisiDisentuhManual(true)
            setShowPresisi(true)
            const metaObj = initialData.surahMeta;
            
            // Coba ambil dari array meta jika ada, kalau tidak fallback ke root surahMulai (backward-compatibility)
            const first = metaObj.meta?.[0]?.surahMulai || metaObj.surahMulai;
            const last = metaObj.meta?.[metaObj.meta?.length - 1]?.surahSelesai || metaObj.surahSelesai;
            
            if (first) {
                setOverrideAwal({ surahNomor: first.nomor, ayat: first.ayat })
            }
            if (last) {
                setOverrideAkhir({ surahNomor: last.nomor, ayat: last.ayat })
            }
        }
      }
    }
  }, [mode, initialData])

  // Auto kalkulasi meta Sabqi/Manzil
  useEffect(() => {
    if (jenisSetoran === 'ziyadah') {
      setMetaInfo(null)
      return
    }

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
        if (juzMulai <= juzSelesai) {
          metaAuto = buatSurahMetaLintasJuz(juzMulai, awalParsed.halaman, juzSelesai, akhirParsed.halaman)
        }
      }
      
      const halamanTidakPenuh = (awalParsed.pecahan > 0) || (akhirParsed.pecahan > 0);
      
      if (halamanTidakPenuh && metaAuto && !showPresisi && !presisiDisentuhManual && mode === 'create') {
        setOverrideAwal({ surahNomor: metaAuto.surahMulai.nomor, ayat: metaAuto.surahMulai.ayat })
        setOverrideAkhir({ surahNomor: metaAuto.surahSelesai.nomor, ayat: metaAuto.surahSelesai.ayat })
        setShowPresisi(true)
      } else if (halamanTidakPenuh && metaAuto && mode === 'edit' && !showPresisi) {
        // In edit mode, if fractional, show precision if user hasn't explicitly closed it
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
  }, [jenisSetoran, lintasJuz, juz, halamanAwal, halamanAkhir, juzMulai, juzSelesai, halMulai, halSelesai, overrideAwal, overrideAkhir, showPresisi, presisiDisentuhManual, mode])

  // Ziyadah Prefill untuk Mode Create
  const prefill = useMemo(() => {
    if (mode === 'edit' || jenisSetoran !== 'ziyadah' || !santri) return null;
    return prefillZiyadahBerikutnya(santri.posisiTerakhir, urutanHafalan)
  }, [jenisSetoran, santri, urutanHafalan, mode])



  // Evaluasi Surah Mulai
  const actualSurahMulaiNomor = mode === 'create' ? (prefill?.surahNomor || 1) : editSurahMulaiNomor;
  const actualAyatMulai = mode === 'create' ? (prefill?.ayat || 1) : editAyatMulai;
  const actualSurahMulaiObj = surahByNomor[actualSurahMulaiNomor];

  // Inisialisasi default Ziyadah suratSelesai (Hanya di mode create)
  useEffect(() => {
    if (mode === 'create' && prefill && surahSelesaiNomor === 0) {
      setSurahSelesaiNomor(prefill.surahNomor);
      setAyatSelesai(prefill.ayat);
    }
  }, [prefill, surahSelesaiNomor, mode])

  const opsiSurahSelesai = useMemo(() => {
    if (!actualSurahMulaiNomor) return [];
    return SURAH_LIST.filter((s: any) => s.nomor >= actualSurahMulaiNomor && s.nomor <= actualSurahMulaiNomor + 5);
  }, [actualSurahMulaiNomor])

  const surahSelesaiObj = surahSelesaiNomor ? surahByNomor[surahSelesaiNomor] : null;

  const ziyadahLabel = useMemo(() => {
    if (jenisSetoran !== 'ziyadah' || !actualSurahMulaiNomor || !ayatSelesai || !surahSelesaiObj) return null;
    try {
      return labelRentangAyatZiyadah(actualSurahMulaiNomor, actualAyatMulai, surahSelesaiNomor, Number(ayatSelesai));
    } catch {
      return null;
    }
  }, [jenisSetoran, actualSurahMulaiNomor, actualAyatMulai, surahSelesaiNomor, ayatSelesai, surahSelesaiObj])

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (mode === 'create' && !santri && isUstadz) return setErrorMsg('Pilih santri terlebih dahulu')
    if (!kualitas) return setErrorMsg('Pilih kualitas hafalan')

    setSubmitting(true)

    try {
      let payload: any = {
        jenis: jenisSetoran,
        kualitas,
        catatan,
      }

      if (mode === 'create') {
        payload.santriId = santri?.id
      } else {
        payload.id = initialData.id
        if (isUstadz) payload.santriId = initialData.santriId
      }

      if (jenisSetoran === 'ziyadah') {
        if (!actualSurahMulaiObj || !surahSelesaiObj || !ziyadahLabel) throw new Error('Data Ziyadah tidak valid')
        
        payload.surah = actualSurahMulaiObj.nama
        payload.surahNomor = actualSurahMulaiNomor
        payload.ayatAwal = actualAyatMulai
        payload.ayatAkhir = Number(ayatSelesai)
        
        payload.surahMeta = { 
            label: ziyadahLabel,
            meta: [
                {
                    surahMulai: { nomor: actualSurahMulaiNomor, ayat: actualAyatMulai, nama: actualSurahMulaiObj.nama },
                    surahSelesai: { nomor: surahSelesaiNomor, ayat: Number(ayatSelesai), nama: surahSelesaiObj.nama }
                }
            ]
        }
      } else {
        if (!metaInfo) throw new Error('Data rentang juz/halaman tidak valid')
        
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
      }

      const res = await onSubmit(payload)
      
      if (res.success) {
        setSuccessMsg('Setoran berhasil disimpan!')
        if (mode === 'create') {
            setCatatan('')
            setKualitas(null)
            if (jenisSetoran === 'ziyadah') {
                setSurahSelesaiNomor(0)
                setAyatSelesai('')
            }
            setTimeout(() => setSuccessMsg(''), 3000)
        }
      } else {
        setErrorMsg(res.error?.message || 'Terjadi kesalahan')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan setoran')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Jika error message di luar flow modal */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
          <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">{successMsg}</p>
        </div>
      )}

      {/* 2. Tabs Jenis Setoran (Jika Mode Create, atau Edit dengan Jenis Fixed) */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex gap-1 shadow-sm">
        {JENIS_TABS.map((tab) => {
          const isActive = jenisSetoran === tab.id;
          const isLocked = mode === 'edit' && tab.id !== jenisSetoran; // In edit mode, you cannot change jenis
          const a = ACCENTS[tab.accent as keyof typeof ACCENTS];
          return (
            <button
              key={tab.id}
              type="button"
              disabled={isLocked}
              onClick={() => {
                if (!isLocked) {
                    setJenisSetoran(tab.id as 'ziyadah' | 'sabqi' | 'manzil')
                    setErrorMsg('')
                }
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-center transition-all duration-200 ${
                isActive 
                  ? `${a.solidBg} text-white shadow-sm` 
                  : `text-slate-500 ${!isLocked && 'hover:bg-slate-50 hover:text-slate-700'} ${isLocked && 'opacity-50 cursor-not-allowed'}`
              }`}
            >
              <div className="text-[13px] font-bold tracking-wide">{tab.label}</div>
              <div className={`text-[9px] ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{tab.desc}</div>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`bg-white rounded-xl border p-4 shadow-sm transition-colors duration-300 ${ACCENTS[activeAccent].border}`}>
          
          {jenisSetoran === 'ziyadah' && (
            <div className="space-y-4">
              <SectionLabel accent="emerald">Surat Mulai</SectionLabel>
              
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Surah</span>
                  <span className="text-sm font-semibold text-slate-700 truncate">{actualSurahMulaiObj?.nama || '-'}</span>
                </div>
                <div className="w-20 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Ayat</span>
                  <span className="text-sm font-semibold text-slate-700">{actualAyatMulai}</span>
                </div>
              </div>

              <div className="pt-2">
                <SectionLabel accent="emerald">Surat Selesai</SectionLabel>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <select
                      value={surahSelesaiNomor}
                      onChange={(e) => setSurahSelesaiNomor(Number(e.target.value))}
                      className="w-full appearance-none bg-white border border-emerald-200 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block px-3 py-2.5 pr-8"
                    >
                      <option value="0">Pilih Surah</option>
                      {opsiSurahSelesai.map((s: any) => (
                        <option key={s.nomor} value={s.nomor}>{s.nomor}. {s.nama}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min={surahSelesaiNomor === actualSurahMulaiNomor ? actualAyatMulai : 1}
                      max={surahSelesaiObj?.totalAyat || 999}
                      value={ayatSelesai}
                      onChange={(e) => setAyatSelesai(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ayat"
                      className="w-full bg-white border border-emerald-200 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2.5"
                      required
                    />
                  </div>
                </div>
              </div>

              {ziyadahLabel && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Terbaca sistem</p>
                  <p className="text-sm font-semibold text-emerald-700">{ziyadahLabel}</p>
                </div>
              )}
            </div>
          )}

          {/* SABQI / MANZIL */}
          {jenisSetoran !== 'ziyadah' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <SectionLabel accent={activeAccent}>Rentang Hafalan</SectionLabel>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lintasJuz}
                    onChange={(e) => setLintasJuz(e.target.checked)}
                    className={`w-4 h-4 rounded border-slate-300 focus:ring-2 ${ACCENTS[activeAccent].text} ${ACCENTS[activeAccent].ring}`}
                  />
                  <span className="text-[11px] font-bold text-slate-600 tracking-wider">LINTAS JUZ</span>
                </label>
              </div>

              {!lintasJuz ? (
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={juz}
                      onChange={(e) => setJuz(Number(e.target.value))}
                      className={`w-full appearance-none bg-white border ${ACCENTS[activeAccent].border} text-slate-900 text-sm rounded-lg block px-3 py-2.5 pr-8`}
                    >
                      {JUZ_TABLE.map((j) => (
                        <option key={j.juz} value={j.juz}>Juz {j.juz}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Hal. Mulai</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={halamanAwal}
                        onChange={(e) => setHalamanAwal(e.target.value)}
                        placeholder="Cth: 1 atau 1,5"
                        className={`w-full border ${parseError.mulai ? 'border-red-300 bg-red-50' : ACCENTS[activeAccent].border} rounded-lg px-3 py-2 text-sm`}
                        required
                      />
                      {parseError.mulai && <p className="text-[10px] text-red-500 mt-1">{parseError.mulai}</p>}
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Hal. Selesai</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={halamanAkhir}
                        onChange={(e) => setHalamanAkhir(e.target.value)}
                        placeholder="Cth: 2 atau 2,5"
                        className={`w-full border ${parseError.selesai ? 'border-red-300 bg-red-50' : ACCENTS[activeAccent].border} rounded-lg px-3 py-2 text-sm`}
                        required
                      />
                      {parseError.selesai && <p className="text-[10px] text-red-500 mt-1">{parseError.selesai}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <select value={juzMulai} onChange={(e) => setJuzMulai(Number(e.target.value))} className={`w-full appearance-none bg-white border ${ACCENTS[activeAccent].border} rounded-lg px-3 py-2 text-sm`}>
                        {JUZ_TABLE.map((j) => <option key={j.juz} value={j.juz}>Juz {j.juz}</option>)}
                      </select>
                      <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>
                    <span className="text-slate-400 font-bold">→</span>
                    <div className="flex-1 relative">
                      <select value={juzSelesai} onChange={(e) => setJuzSelesai(Number(e.target.value))} className={`w-full appearance-none bg-white border ${ACCENTS[activeAccent].border} rounded-lg px-3 py-2 text-sm`}>
                        {JUZ_TABLE.map((j) => <option key={j.juz} value={j.juz}>Juz {j.juz}</option>)}
                      </select>
                      <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input type="text" inputMode="decimal" value={halMulai} onChange={(e) => setHalMulai(e.target.value)} placeholder="Hal. Mulai" className={`w-full border ${parseError.mulai ? 'border-red-300 bg-red-50' : ACCENTS[activeAccent].border} rounded-lg px-3 py-2 text-sm`} required />
                      {parseError.mulai && <p className="text-[10px] text-red-500 mt-1">{parseError.mulai}</p>}
                    </div>
                    <div className="flex-1">
                      <input type="text" inputMode="decimal" value={halSelesai} onChange={(e) => setHalSelesai(e.target.value)} placeholder="Hal. Selesai" className={`w-full border ${parseError.selesai ? 'border-red-300 bg-red-50' : ACCENTS[activeAccent].border} rounded-lg px-3 py-2 text-sm`} required />
                      {parseError.selesai && <p className="text-[10px] text-red-500 mt-1">{parseError.selesai}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Presisi Ayat Panel */}
              {metaInfo && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button 
                    type="button" 
                    onClick={() => {
                        setShowPresisi(!showPresisi)
                        setPresisiDisentuhManual(true)
                    }}
                    className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${showPresisi ? ACCENTS[activeAccent].text : 'text-slate-500'}`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Presisi Ayat {showPresisi ? '(Aktif)' : '(Opsional)'}
                  </button>
                  
                  {showPresisi && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Override Ayat Mulai</label>
                        <div className="flex gap-2">
                          <select 
                            value={overrideAwal?.surahNomor || metaInfo.surahMulai?.nomor}
                            onChange={(e) => setOverrideAwal({ ...overrideAwal, surahNomor: Number(e.target.value), ayat: 1 })}
                            className="flex-1 text-xs border-slate-200 rounded-md py-1.5"
                          >
                            {SURAH_LIST.map((s: any) => <option key={s.nomor} value={s.nomor}>{s.nama}</option>)}
                          </select>
                          <input 
                            type="number" 
                            className="w-16 text-xs border-slate-200 rounded-md py-1.5"
                            value={overrideAwal?.ayat || metaInfo.surahMulai?.ayat}
                            onChange={(e) => setOverrideAwal({ ...overrideAwal, ayat: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Override Ayat Selesai</label>
                        <div className="flex gap-2">
                          <select 
                            value={overrideAkhir?.surahNomor || metaInfo.surahSelesai?.nomor}
                            onChange={(e) => setOverrideAkhir({ ...overrideAkhir, surahNomor: Number(e.target.value), ayat: 1 })}
                            className="flex-1 text-xs border-slate-200 rounded-md py-1.5"
                          >
                            {SURAH_LIST.map((s: any) => <option key={s.nomor} value={s.nomor}>{s.nama}</option>)}
                          </select>
                          <input 
                            type="number" 
                            className="w-16 text-xs border-slate-200 rounded-md py-1.5"
                            value={overrideAkhir?.ayat || metaInfo.surahSelesai?.ayat}
                            onChange={(e) => setOverrideAkhir({ ...overrideAkhir, ayat: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={() => {
                                setOverrideAwal(null)
                                setOverrideAkhir(null)
                                setShowPresisi(false)
                                setPresisiDisentuhManual(false)
                            }}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider bg-red-50 px-2 py-1 rounded"
                        >
                            Reset Presisi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <PreviewBox 
                accent={activeAccent} 
                meta={metaInfo} 
                note={halamanAwal.includes(',') || halamanAkhir.includes(',') || halMulai.includes(',') || halSelesai.includes(',') ? "Termasuk pecahan halaman" : ""} 
              />
            </div>
          )}
        </div>

        {/* 4. Kualitas Hafalan & Catatan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <SectionLabel accent={activeAccent}>Kualitas Hafalan</SectionLabel>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {KUALITAS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setKualitas(opt.id as any)}
                className={`py-2.5 px-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border
                  ${kualitas === opt.id 
                    ? `${opt.color} ring-1 ring-current shadow-sm` 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <SectionLabel accent={activeAccent}>Catatan Tambahan</SectionLabel>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors resize-none"
            placeholder="Tulis pesan/catatan..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-2 pt-2">
            {mode === 'edit' && onCancel && (
                <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm text-sm"
                >
                Batal
                </button>
            )}
            <button
            type="submit"
            disabled={submitting || (mode === 'create' && isUstadz && !santri) || (jenisSetoran === 'ziyadah' ? (!actualSurahMulaiObj || !surahSelesaiObj) : !metaInfo)}
            className={`flex-1 py-3.5 px-4 ${ACCENTS[activeAccent].solidBg} ${ACCENTS[activeAccent].solidBgHover} text-white font-bold rounded-xl shadow-sm shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200 text-sm tracking-wide`}
            >
            {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {mode === 'create' ? 'Menyimpan...' : 'Memperbarui...'}</>
            ) : (
                <>{mode === 'create' ? 'Simpan Setoran' : 'Simpan Perubahan'}</>
            )}
            </button>
        </div>
      </form>
    </div>
  )
}

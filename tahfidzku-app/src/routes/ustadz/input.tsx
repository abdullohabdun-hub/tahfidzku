import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Loader2, Info } from 'lucide-react'
import { getSantriList, createSetoran } from '../../server-fns/ustadz'
import { 
  buatSurahMetaOtomatis, 
  buatSurahMetaLintasJuz, 
  prefillZiyadahBerikutnya, 
  surahByNomor, 
  JUZ_TABLE,
  getTotalHalamanJuz
} from '../../lib/quranMapper'

export const Route = createFileRoute('/ustadz/input')({
  component: InputSetoranPage,
})

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
};

const JENIS_TABS = [
  { id: 'ziyadah', label: 'Ziyadah', accent: 'emerald', desc: 'Hafalan baru' },
  { id: 'sabqi', label: 'Sabqi', accent: 'amber', desc: 'Murojaah dekat' },
  { id: 'manzil', label: 'Manzil', accent: 'indigo', desc: 'Murojaah jauh' }
];

const KUALITAS_OPTIONS = [
  { id: 'lancar', label: 'Lancar', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'mengulang', label: 'Mengulang', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'terbata', label: 'Terbata-bata', color: 'bg-red-100 text-red-800 border-red-200' }
]

function SectionLabel({ accent, children }: { accent: keyof typeof ACCENTS, children: React.ReactNode }) {
  const a = ACCENTS[accent];
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</p>
    </div>
  );
}

function FieldChip({ label, value, accent }: { label: string, value: string | number, accent: keyof typeof ACCENTS }) {
  const a = ACCENTS[accent];
  return (
    <div className="flex-1">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className={`rounded-lg ${a.chipBg} ${a.chipText} px-3 py-2.5 font-medium text-sm flex items-center justify-between`}>
        {value}
        <span className="text-[9px] font-normal uppercase tracking-wide opacity-60">Otomatis</span>
      </div>
    </div>
  );
}

function PreviewBox({ accent, meta, note }: { accent: keyof typeof ACCENTS, meta: any, note?: string }) {
  const a = ACCENTS[accent];
  if (!meta) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-500 text-center">
        Lengkapi input untuk melihat pratinjau surat & ayat.
      </div>
    );
  }
  return (
    <div className={`mt-4 rounded-xl ${a.softBg} border ${a.border} px-4 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Terbaca sistem</p>
          <p className={`text-sm font-semibold ${a.text}`}>{meta.label}</p>
        </div>
      </div>
      {(meta.lintasJuz || note) && (
        <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50">
          {meta.lintasJuz ? `Lintas juz ${meta.juzMulai} → ${meta.juzSelesai}. ` : ""}
          {note}
        </p>
      )}
    </div>
  );
}

function InputSetoranPage() {
  const [santriList, setSantriList] = useState<any[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // State Utama
  const [santriId, setSantriId] = useState('')
  const [jenisSetoran, setJenisSetoran] = useState<'ziyadah' | 'sabqi' | 'manzil'>('ziyadah')
  const activeAccent = JENIS_TABS.find(t => t.id === jenisSetoran)?.accent as keyof typeof ACCENTS || 'emerald'
  
  const selectedSantri = useMemo(() => santriList.find(s => s.id === santriId), [santriId, santriList])

  // Ziyadah State
  const [ayatSelesai, setAyatSelesai] = useState<number | ''>('')
  
  // Sabqi / Manzil State
  const [lintasJuz, setLintasJuz] = useState(false)
  
  // -- Standar (Tidak lintas juz)
  const [juz, setJuz] = useState<number>(30)
  const [halamanAwal, setHalamanAwal] = useState<number>(1)
  const [halamanAkhir, setHalamanAkhir] = useState<number>(1)
  
  // -- Lintas Juz
  const [juzMulai, setJuzMulai] = useState<number>(29)
  const [juzSelesai, setJuzSelesai] = useState<number>(30)
  const [halMulai, setHalMulai] = useState<number>(1)
  const [halSelesai, setHalSelesai] = useState<number>(1)

  // Hasil Meta Sabqi/Manzil
  const [metaInfo, setMetaInfo] = useState<any>(null)

  const [kualitas, setKualitas] = useState<'lancar' | 'mengulang' | 'terbata' | null>(null)
  const [catatan, setCatatan] = useState('')

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

  // Auto kalkulasi meta Sabqi/Manzil
  useEffect(() => {
    if (jenisSetoran === 'ziyadah') {
      setMetaInfo(null)
      return
    }

    try {
      if (!lintasJuz) {
        // Validasi max halaman
        const maxHal = getTotalHalamanJuz(juz)
        const safeHalamanAwal = Math.min(Math.max(1, halamanAwal), maxHal)
        const safeHalamanAkhir = Math.min(Math.max(1, halamanAkhir), maxHal)
        
        if (safeHalamanAwal <= safeHalamanAkhir) {
          const meta = buatSurahMetaOtomatis(juz, safeHalamanAwal, juz, safeHalamanAkhir)
          setMetaInfo(meta)
        } else {
          setMetaInfo(null)
        }
      } else {
        // Lintas juz
        if (juzMulai < juzSelesai) {
          const meta = buatSurahMetaLintasJuz(juzMulai, halMulai, juzSelesai, halSelesai)
          setMetaInfo(meta)
        } else {
          setMetaInfo(null)
        }
      }
    } catch (e) {
      setMetaInfo(null)
    }
  }, [jenisSetoran, lintasJuz, juz, halamanAwal, halamanAkhir, juzMulai, juzSelesai, halMulai, halSelesai])

  // Ziyadah Prefill
  const prefill = useMemo(() => {
    if (jenisSetoran !== 'ziyadah' || !selectedSantri) return null;
    return prefillZiyadahBerikutnya(selectedSantri.posisiTerakhir)
  }, [jenisSetoran, selectedSantri])

  const prefillSurah = prefill ? surahByNomor[prefill.surahNomor] : null

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!santriId) return setErrorMsg('Pilih santri terlebih dahulu')
    if (!kualitas) return setErrorMsg('Pilih kualitas hafalan')

    setSubmitting(true)

    try {
      let payload: any = {
        santriId,
        jenis: jenisSetoran,
        kualitas,
        catatan,
      }

      if (jenisSetoran === 'ziyadah') {
        if (!prefill || !prefillSurah) throw new Error('Data Ziyadah tidak valid')
        if (ayatSelesai === '' || ayatSelesai < prefill.ayat || ayatSelesai > prefillSurah.totalAyat) {
          throw new Error('Ayat selesai tidak valid')
        }
        
        payload.surah = prefillSurah.nama
        payload.surahNomor = prefill.surahNomor
        payload.ayatAwal = prefill.ayat
        payload.ayatAkhir = ayatSelesai
      } else {
        if (!metaInfo) throw new Error('Data rentang juz/halaman tidak valid')
        
        if (lintasJuz) {
           payload.lintasJuz = true
           payload.juzMulai = juzMulai
           payload.juzSelesai = juzSelesai
           payload.halamanAwal = halMulai
           payload.halamanAkhir = halSelesai
        } else {
           payload.lintasJuz = false
           payload.juzMulai = juz
           payload.juzSelesai = juz
           payload.halamanAwal = halamanAwal
           payload.halamanAkhir = halamanAkhir
        }
        
        payload.surahMeta = metaInfo
      }

      const res = await createSetoran({ data: payload })
      if (res.success) {
        setSuccessMsg('Setoran berhasil disimpan!')
        setCatatan('')
        setKualitas(null)
        setAyatSelesai('')
        
        // Update local santri list state with new posisiTerakhir
        if (jenisSetoran === 'ziyadah' && payload.surahNomor && payload.ayatAkhir) {
          setSantriList(prev => prev.map(s => {
            if (s.id === santriId) {
              return { ...s, posisiTerakhir: { surahNomor: payload.surahNomor, ayat: payload.ayatAkhir } }
            }
            return s
          }))
        }
        
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        setErrorMsg(res.error?.message || 'Terjadi kesalahan')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan setoran')
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

      {/* 2. Tabs Jenis Setoran */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex gap-1 shadow-sm">
        {JENIS_TABS.map((tab) => {
          const isActive = jenisSetoran === tab.id;
          const a = ACCENTS[tab.accent as keyof typeof ACCENTS];
          return (
            <button
              key={tab.id}
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
        
        {/* PANEL ZIYADAH */}
        {jenisSetoran === 'ziyadah' && (
          <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm shadow-emerald-50/50">
            <SectionLabel accent="emerald">Lanjutan otomatis hafalan</SectionLabel>
            
            {!prefill ? (
              <p className="text-sm text-slate-500 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                Santri ini sudah khatam 30 Juz. Tidak ada kelanjutan Ziyadah otomatis.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <FieldChip accent="emerald" label="Surat" value={prefill.namaSurah} />
                  <FieldChip accent="emerald" label="Ayat Mulai" value={prefill.ayat} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ayat Selesai</label>
                  <input
                    type="number"
                    min={prefill.ayat}
                    max={prefillSurah?.totalAyat}
                    value={ayatSelesai}
                    onChange={(e) => setAyatSelesai(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={`Max: ${prefillSurah?.totalAyat}`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Maksimal ayat untuk {prefillSurah?.nama} adalah {prefillSurah?.totalAyat}.
                  </p>
                </div>
                
                <PreviewBox 
                  accent="emerald"
                  meta={ayatSelesai !== '' && ayatSelesai >= prefill.ayat && ayatSelesai <= (prefillSurah?.totalAyat||0) ? {
                    label: ayatSelesai === prefill.ayat 
                      ? `${prefill.namaSurah} ayat ${prefill.ayat}` 
                      : `${prefill.namaSurah} ayat ${prefill.ayat}-${ayatSelesai}`
                  } : null}
                  note={
                    ayatSelesai !== '' && ayatSelesai >= prefill.ayat && ayatSelesai <= (prefillSurah?.totalAyat||0) 
                    ? `Setoran berikutnya akan otomatis dimulai dari ayat setelahnya.` : undefined
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* PANEL SABQI / MANZIL */}
        {(jenisSetoran === 'sabqi' || jenisSetoran === 'manzil') && (
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
                      setHalamanAwal(1)
                      setHalamanAkhir(1)
                    }}
                    className={`w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                  >
                    {JUZ_TABLE.map(j => (
                      <option key={j.juz} value={j.juz}>Juz {j.juz} ({j.halamanAkhir - j.halamanAwal + 1} Halaman)</option>
                    ))}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 bottom-3 pointer-events-none" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1.5">Hal. Mulai</label>
                    <input 
                      type="number" step="0.25" min={1} max={getTotalHalamanJuz(juz)}
                      value={halamanAwal} onChange={e => setHalamanAwal(Number(e.target.value))}
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1.5">Hal. Selesai</label>
                    <input 
                      type="number" step="0.25" min={halamanAwal} max={getTotalHalamanJuz(juz)}
                      value={halamanAkhir} onChange={e => setHalamanAkhir(Number(e.target.value))}
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    />
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
                        setHalMulai(1)
                      }}
                      className={`w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm pr-6 focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    >
                      {JUZ_TABLE.filter(j => j.juz < 30).map(j => (
                        <option key={j.juz} value={j.juz}>Juz {j.juz}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input 
                      type="number" step="0.25" min={1} max={getTotalHalamanJuz(juzMulai)}
                      value={halMulai} onChange={e => setHalMulai(Number(e.target.value))}
                      placeholder="Hal"
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    />
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
                        setHalSelesai(1)
                      }}
                      className={`w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm pr-6 focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    >
                      {JUZ_TABLE.filter(j => j.juz > juzMulai).map(j => (
                        <option key={j.juz} value={j.juz}>Juz {j.juz}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input 
                      type="number" step="0.25" min={1} max={getTotalHalamanJuz(juzSelesai)}
                      value={halSelesai} onChange={e => setHalSelesai(Number(e.target.value))}
                      placeholder="Hal"
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ACCENTS[activeAccent].ring}`}
                    />
                  </div>
                </div>
              </div>
            )}

            <PreviewBox accent={activeAccent} meta={metaInfo} />
          </div>
        )}

        {/* 3. Kualitas & Catatan */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <SectionLabel accent={activeAccent}>Penilaian</SectionLabel>
          
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan (Opsional)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Perbaiki tajwid di akhir ayat..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[80px]"
            />
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
            <Info className="w-4 h-4" /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 flex items-center gap-2">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || (jenisSetoran === 'ziyadah' && !prefill) || (jenisSetoran !== 'ziyadah' && !metaInfo)}
          className={`w-full py-3.5 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${ACCENTS[activeAccent].solidBg} ${ACCENTS[activeAccent].solidBgHover}`}
        >
          {submitting ? (
             <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
          ) : (
            <><Check className="w-5 h-5" /> Simpan Setoran</>
          )}
        </button>
      </form>
    </div>
  )
}

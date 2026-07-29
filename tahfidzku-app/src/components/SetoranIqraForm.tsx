import React, { useState } from 'react'
import { Check, Loader2, Info } from 'lucide-react'
import { SKOR_LIST, SKOR_DEFAULT_LABELS, SKOR_WARNA_SOLID } from '../lib/penilaian'
import type { SkorKualitas, StatusHafalan } from '../lib/penilaian'

const ACCENT = {
  text: "text-purple-700",
  solidBg: "bg-purple-600",
  solidBgHover: "hover:bg-purple-700",
  softBg: "bg-purple-50",
  border: "border-purple-200",
  ring: "focus:ring-purple-500 focus:border-purple-500",
  dot: "bg-purple-500",
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-1.5 h-1.5 rounded-full ${ACCENT.dot}`} />
      <span className={`text-[11px] font-bold tracking-widest uppercase ${ACCENT.text}`}>{children}</span>
    </div>
  );
}

interface SetoranIqraFormProps {
  santri: any;
  onSubmit: (payload: any) => Promise<{ success: boolean; error?: any }>;
}

export function SetoranIqraForm({ santri, onSubmit }: SetoranIqraFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [jilid, setJilid] = useState<number>(santri?.jilidIqraTerakhir || 1)
  const [halamanAwal, setHalamanAwal] = useState<number | ''>('')
  const [halamanAkhir, setHalamanAkhir] = useState<number | ''>('')

  const [skorKualitas, setSkorKualitas] = useState<SkorKualitas | null>(null)
  const [statusHafalan, setStatusHafalan] = useState<StatusHafalan | null>(null)
  const [catatan, setCatatan] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!santri) return setErrorMsg('Pilih santri terlebih dahulu')
    if (!jilid) return setErrorMsg('Pilih jilid Iqra')
    if (halamanAwal === '' || halamanAkhir === '') return setErrorMsg('Isi halaman awal dan akhir')
    if (!skorKualitas) return setErrorMsg('Pilih skor kualitas bacaan (1-5)')
    if (!statusHafalan) return setErrorMsg('Pilih status kelancaran (Lanjut atau Mengulang)')

    setSubmitting(true)

    try {
      const payload = {
        santriId: santri.id,
        jilid,
        halamanAwal: Number(halamanAwal),
        halamanAkhir: Number(halamanAkhir),
        skorKualitas,
        statusHafalan,
        catatan,
      }

      const res = await onSubmit(payload)
      
      if (res.success) {
        setSuccessMsg('Setoran Iqra berhasil disimpan!')
        setCatatan('')
        setSkorKualitas(null)
        setStatusHafalan(null)
        setHalamanAwal('')
        setHalamanAkhir('')
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        setErrorMsg(res.error?.message || 'Terjadi kesalahan saat menyimpan data.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan setoran Iqra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rentang Hafalan */}
        <div className={`bg-white rounded-xl border p-4 shadow-sm transition-colors duration-300 ${ACCENT.border}`}>
          <SectionLabel>Rentang Bacaan Iqra</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Jilid</label>
              <select
                value={jilid}
                onChange={(e) => setJilid(Number(e.target.value))}
                className={`w-full appearance-none bg-white border ${ACCENT.border} text-slate-900 text-sm rounded-lg px-3 py-2.5`}
              >
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <option key={j} value={j}>Jilid {j}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Hal. Awal</label>
              <input
                type="number"
                min={1}
                value={halamanAwal}
                onChange={(e) => setHalamanAwal(e.target.value ? Number(e.target.value) : '')}
                placeholder="Cth: 1"
                className={`w-full border ${ACCENT.border} rounded-lg px-3 py-2.5 text-sm ${ACCENT.ring}`}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Hal. Akhir</label>
              <input
                type="number"
                min={halamanAwal || 1}
                value={halamanAkhir}
                onChange={(e) => setHalamanAkhir(e.target.value ? Number(e.target.value) : '')}
                placeholder="Cth: 3"
                className={`w-full border ${ACCENT.border} rounded-lg px-3 py-2.5 text-sm ${ACCENT.ring}`}
                required
              />
            </div>
          </div>
        </div>

        {/* Penilaian */}
        <div className={`bg-white rounded-xl border ${ACCENT.border} p-4 shadow-sm mb-4`}>
          <SectionLabel>Skor Kualitas Bacaan</SectionLabel>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {SKOR_LIST.map((skor) => {
              const isSelected = skorKualitas === skor
              const warnaSolid = isSelected ? SKOR_WARNA_SOLID[skor] : ''
              return (
                <button
                  key={skor}
                  type="button"
                  onClick={() => setSkorKualitas(skor)}
                  className={`py-3 px-1 rounded-xl text-center transition-all duration-200 border-2 flex flex-col items-center gap-0.5
                    ${isSelected
                      ? `${warnaSolid} shadow-md scale-105 border-transparent`
                      : `bg-white ${ACCENT.border} text-slate-500 hover:bg-slate-50 hover:scale-102`
                    }
                  `}
                >
                  <span className={`text-lg font-black leading-none ${isSelected ? 'text-white' : 'text-slate-700'}`}>{skor}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide leading-tight text-center ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
                    {SKOR_DEFAULT_LABELS[skor]}
                  </span>
                </button>
              )
            })}
          </div>

          <SectionLabel>Status Kelancaran</SectionLabel>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setStatusHafalan('lanjut')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 border-2 flex items-center justify-center gap-2
                ${statusHafalan === 'lanjut'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-200'
                }
              `}
            >
              <span className="text-base">✓</span>
              Lanjut
            </button>
            <button
              type="button"
              onClick={() => setStatusHafalan('mengulang')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 border-2 flex items-center justify-center gap-2
                ${statusHafalan === 'mengulang'
                  ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-amber-50 hover:border-amber-200'
                }
              `}
            >
              <span className="text-base">↩</span>
              Mengulang
            </button>
          </div>

          <SectionLabel>Catatan Tambahan</SectionLabel>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className={`w-full border ${ACCENT.border} rounded-lg p-3 text-sm bg-slate-50 focus:bg-white transition-colors resize-none ${ACCENT.ring}`}
            placeholder="Tulis pesan/catatan..."
          />
        </div>

        {/* Submit */}
        <div className="flex pt-2">
          <button
            type="submit"
            disabled={submitting || !santri}
            className={`flex-1 py-3.5 px-4 ${ACCENT.solidBg} ${ACCENT.solidBgHover} text-white font-bold rounded-xl shadow-sm shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200 text-sm tracking-wide`}
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
            ) : (
              <>Simpan Setoran Iqra</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

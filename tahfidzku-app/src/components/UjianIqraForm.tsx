import React, { useState } from 'react'
import { Check, Loader2, Info } from 'lucide-react'

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

interface UjianIqraFormProps {
  santri: any;
  onSubmit: (payload: any) => Promise<{ success: boolean; error?: any }>;
}

export function UjianIqraForm({ santri, onSubmit }: UjianIqraFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [jilidDiuji, setJilidDiuji] = useState<number>(santri?.jilidIqraTerakhir || 1)
  const [skor, setSkor] = useState<number | ''>('')
  const [lulus, setLulus] = useState<boolean>(true)
  const [catatan, setCatatan] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!santri) return setErrorMsg('Pilih santri terlebih dahulu')
    if (!jilidDiuji) return setErrorMsg('Pilih jilid yang diuji')
    if (skor !== '' && (Number(skor) < 0 || Number(skor) > 100)) return setErrorMsg('Skor harus antara 0 dan 100')

    setSubmitting(true)

    try {
      const payload = {
        santriId: santri.id,
        jilidDiuji,
        skor: skor !== '' ? Number(skor) : null,
        lulus,
        catatan,
      }

      const res = await onSubmit(payload)
      
      if (res.success) {
        setSuccessMsg('Ujian Iqra berhasil disimpan!')
        setCatatan('')
        setSkor('')
        setLulus(true)
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        setErrorMsg(res.error?.message || 'Terjadi kesalahan saat menyimpan data.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan ujian Iqra')
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
        <div className={`bg-white rounded-xl border p-4 shadow-sm transition-colors duration-300 ${ACCENT.border}`}>
          <SectionLabel>Data Ujian Kenaikan Jilid</SectionLabel>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Jilid Diuji</label>
              <select
                value={jilidDiuji}
                onChange={(e) => setJilidDiuji(Number(e.target.value))}
                className={`w-full appearance-none bg-white border ${ACCENT.border} text-slate-900 text-sm rounded-lg px-3 py-2.5`}
              >
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <option key={j} value={j}>Jilid {j}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Skor (Opsional)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={skor}
                onChange={(e) => setSkor(e.target.value ? Number(e.target.value) : '')}
                placeholder="0-100"
                className={`w-full border ${ACCENT.border} rounded-lg px-3 py-2.5 text-sm ${ACCENT.ring}`}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Hasil Ujian</label>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${lulus ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" name="hasil_ujian" checked={lulus} onChange={() => setLulus(true)} className="hidden" />
                <span>Lulus Jilid</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${!lulus ? 'bg-red-50 border-red-500 text-red-700 font-bold' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" name="hasil_ujian" checked={!lulus} onChange={() => setLulus(false)} className="hidden" />
                <span>Tidak Lulus</span>
              </label>
            </div>
          </div>

          <SectionLabel>Catatan Penguji</SectionLabel>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className={`w-full border ${ACCENT.border} rounded-lg p-3 text-sm bg-slate-50 focus:bg-white transition-colors resize-none ${ACCENT.ring}`}
            placeholder="Evaluasi ujian..."
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
              <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan Ujian...</>
            ) : (
              <>Simpan Hasil Ujian</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

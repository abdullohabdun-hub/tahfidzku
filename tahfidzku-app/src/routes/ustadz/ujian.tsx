import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { GraduationCap, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, BookOpen, Loader2, BookMarked } from 'lucide-react'
import { getUjianPending, getUjianList, createUjian } from '../../server-fns/ujian'
import { createUjianIqra } from '../../server-fns/setoran-iqra'
import { hitungSkorUjian, rekomendasiLulus, labelSkor, warnaBadgeStatus, labelStatus } from '../../lib/ujianLogic'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'
import { UjianIqraForm } from '../../components/UjianIqraForm'

export const Route = createFileRoute('/ustadz/ujian')({
  component: UjianPage,
})

type PendingItem = {
  santriId: string
  santriNama: string
  juzUjianPending: number
  gagalCount: number
  warningGagal: boolean
}

type PendingIqraItem = {
  santriId: string
  santriNama: string
  jilidIqraUjianPending: number
  kelasId: string | null
  gagalCount: number
  warningGagal: boolean
}

type UjianRecord = {
  id: string
  santriNama: string
  ustadzNama: string
  juz: number
  kelancaran: string
  tajwid: string
  skor: number
  status: 'lulus' | 'tidak_lulus'
  cakupanMateri: string | null
  catatan: string | null
  attempt: number
  createdAt: Date | string
}

function UjianPage() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<{ message: string, code?: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'riwayat'>('pending')
  const [activeSubTab, setActiveSubTab] = useState<'juz' | 'jilid'>('juz')
  const [pending, setPending] = useState<PendingItem[]>([])
  const [pendingIqra, setPendingIqra] = useState<PendingIqraItem[]>([])
  const [riwayat, setRiwayat] = useState<UjianRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSantri, setSelectedSantri] = useState<PendingItem | null>(null)
  const [selectedSantriIqra, setSelectedSantriIqra] = useState<PendingIqraItem | null>(null)

  // Form state
  const [kelancaran, setKelancaran] = useState<'lancar' | 'mengulang' | 'terbata' | ''>('')
  const [tajwid, setTajwid] = useState<'sempurna' | 'cukup' | 'kurang' | ''>('')
  const [status, setStatus] = useState<'lulus' | 'tidak_lulus' | ''>('')
  const [cakupanMateri, setCakupanMateri] = useState('')
  const [catatan, setCatatan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; msg: string } | null>(null)

  const skorRef = kelancaran && tajwid ? hitungSkorUjian(kelancaran as any, tajwid as any) : null
  const rekLulus = skorRef !== null ? rekomendasiLulus(skorRef) : null

  async function loadData() {
    try {
      setLoading(true)
      const [pRes, rRes] = await Promise.all([getUjianPending(), getUjianList()])
      
      if (!pRes.success || !rRes.success) {
        const err = (!pRes.success ? (pRes as any).error : (!rRes.success ? (rRes as any).error : null))
        if (err?.code === 'UNAUTHENTICATED') {
          navigate({ to: '/login' })
          return
        }
        setAuthError({ message: err?.message || 'Akses ditolak', code: err?.code })
        return
      }

      // getUjianPending sekarang mengembalikan { pendingTahfidz, pendingIqra }
      if (pRes.data) {
        const d = pRes.data as { pendingTahfidz: PendingItem[], pendingIqra: PendingIqraItem[] }
        setPending(d.pendingTahfidz ?? [])
        setPendingIqra(d.pendingIqra ?? [])
      }
      if (rRes.data) setRiwayat(rRes.data as UjianRecord[])
    } catch (err: any) {
      setAuthError({ message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmitUjian(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSantri || !kelancaran || !tajwid || !status) return
    setSubmitting(true)
    setSubmitMsg(null)
    const res = await createUjian({
      data: {
        santriId: selectedSantri.santriId,
        juz: selectedSantri.juzUjianPending,
        kelancaran: kelancaran as any,
        tajwid: tajwid as any,
        status: status as any,
        cakupanMateri: cakupanMateri || undefined,
        catatan: catatan || undefined,
      }
    })
    setSubmitting(false)
    if (res.success) {
      setSubmitMsg({ ok: true, msg: res.message || 'Berhasil' })
      setSelectedSantri(null)
      setKelancaran(''); setTajwid(''); setStatus(''); setCakupanMateri(''); setCatatan('')
      await loadData()
    } else {
      setSubmitMsg({ ok: false, msg: (res as any).error?.message || 'Gagal menyimpan ujian' })
    }
  }

  if (authError) {
    return <AuthErrorAlert error={authError} />
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-emerald-600" /> Ujian Kenaikan
        </h1>
        <p className="text-slate-500 mt-1">Evaluasi santri untuk kenaikan Juz (Tahfidz) dan Jilid (Iqra).</p>
      </div>

      {/* Tabs Level 1 */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['pending', 'riwayat'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'pending' ? (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Ujian Pending
                {(pending.length + pendingIqra.length) > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {pending.length + pendingIqra.length}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Riwayat Ujian
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* ── TAB PENDING ── */}
          {activeTab === 'pending' && (
            <div className="space-y-4">

              {/* Sub-tab Level 2: Kenaikan Juz / Kenaikan Jilid */}
              <div className="flex gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setActiveSubTab('juz')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    activeSubTab === 'juz' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Kenaikan Juz
                  {pending.length > 0 && (
                    <span className="bg-emerald-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{pending.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveSubTab('jilid')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    activeSubTab === 'jilid' ? 'bg-white text-purple-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <BookMarked className="w-3.5 h-3.5" /> Kenaikan Jilid
                  {pendingIqra.length > 0 && (
                    <span className="bg-purple-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{pendingIqra.length}</span>
                  )}
                </button>
              </div>

              {/* ── Sub-tab: Kenaikan Juz (Tahfidz) ── */}
              {activeSubTab === 'juz' && (
                <>
                  {pending.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-slate-700">Tidak Ada Ujian Kenaikan Juz Pending</h3>
                      <p className="text-slate-400 text-sm mt-1">Semua santri sudah lulus atau belum mencapai akhir juz.</p>
                    </div>
                  ) : (
                    pending.map(p => (
                      <div key={p.santriId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-800">{p.santriNama}</h3>
                              {p.warningGagal && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" /> {p.gagalCount}× gagal
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">
                              Menunggu Ujian Kenaikan <span className="font-bold text-emerald-700">Juz {p.juzUjianPending}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => { setSelectedSantri(p); setKelancaran(''); setTajwid(''); setStatus(''); setCakupanMateri(''); setCatatan(''); setSubmitMsg(null) }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            Mulai Ujian <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Modal Form Ujian Tahfidz */}
                  {selectedSantri && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all overflow-y-auto">
                      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 max-w-md w-full animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 shrink-0 border-b border-slate-100">
                          <h2 className="text-lg font-bold text-slate-900">🎓 Ujian Kenaikan Juz {selectedSantri.juzUjianPending}</h2>
                          <p className="text-slate-500 text-sm mt-0.5">Santri: <strong>{selectedSantri.santriNama}</strong></p>
                          {selectedSantri.warningGagal && (
                            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex gap-2 text-sm text-amber-800">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>Santri ini sudah gagal <strong>{selectedSantri.gagalCount}×</strong> untuk juz ini. Pertimbangkan untuk memberi latihan tambahan sebelum ujian ulang.</span>
                            </div>
                          )}
                        </div>

                        <form onSubmit={handleSubmitUjian} className="flex-1 min-h-0 flex flex-col">
                          <div className="p-6 space-y-4 overflow-y-auto">
                            {/* Kelancaran */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">📖 Kelancaran Bacaan</label>
                            <div className="space-y-1.5">
                              {([
                                { val: 'lancar', label: 'Lancar', poin: 50 },
                                { val: 'mengulang', label: 'Mengulang', poin: 30 },
                                { val: 'terbata', label: 'Terbata-bata', poin: 10 },
                              ] as const).map(opt => (
                                <label key={opt.val} className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${kelancaran === opt.val ? 'border-emerald-500 bg-emerald-50/80 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                                  <div className="flex items-center gap-3">
                                    <input type="radio" name="kelancaran" value={opt.val} checked={kelancaran === opt.val} onChange={() => setKelancaran(opt.val)} className="accent-emerald-600 w-4 h-4" />
                                    <span className="text-sm font-medium">{opt.label}</span>
                                  </div>
                                  <span className="text-xs text-slate-400 font-semibold">{opt.poin} poin</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Tajwid */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">✅ Kualitas Tajwid</label>
                            <div className="space-y-1.5">
                              {([
                                { val: 'sempurna', label: 'Sempurna', poin: 50 },
                                { val: 'cukup', label: 'Cukup', poin: 30 },
                                { val: 'kurang', label: 'Kurang', poin: 10 },
                              ] as const).map(opt => (
                                <label key={opt.val} className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${tajwid === opt.val ? 'border-emerald-500 bg-emerald-50/80 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                                  <div className="flex items-center gap-3">
                                    <input type="radio" name="tajwid" value={opt.val} checked={tajwid === opt.val} onChange={() => setTajwid(opt.val)} className="accent-emerald-600 w-4 h-4" />
                                    <span className="text-sm font-medium">{opt.label}</span>
                                  </div>
                                  <span className="text-xs text-slate-400 font-semibold">{opt.poin} poin</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Skor referensi */}
                          {skorRef !== null && (
                            <div className={`rounded-xl p-3 flex items-center justify-between text-sm font-semibold border ${rekLulus ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                              <span>Skor Referensi: {skorRef}/100 — {labelSkor(skorRef)}</span>
                              <span className="opacity-70 text-xs">Rekomendasi: {rekLulus ? 'Lulus' : 'Tidak Lulus'}</span>
                            </div>
                          )}

                          {/* Keputusan Final */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">⚖️ Keputusan Ustadz</label>
                            <div className="flex gap-3">
                              <button type="button" onClick={() => setStatus('lulus')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-1.5 ${status === 'lulus' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 text-slate-600 hover:border-emerald-300'}`}>
                                <CheckCircle className="w-4 h-4" /> Lulus
                              </button>
                              <button type="button" onClick={() => setStatus('tidak_lulus')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-1.5 ${status === 'tidak_lulus' ? 'border-red-600 bg-red-600 text-white' : 'border-slate-200 text-slate-600 hover:border-red-300'}`}>
                                <XCircle className="w-4 h-4" /> Tidak Lulus
                              </button>
                            </div>
                          </div>

                            {/* Cakupan Materi */}
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cakupan Materi (opsional)</label>
                              <input type="text" value={cakupanMateri} onChange={e => setCakupanMateri(e.target.value)} placeholder="Misal: An-Naba 1-20" className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-300 focus:outline-none" />
                            </div>

                            {/* Catatan */}
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Catatan (opsional)</label>
                              <textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Masukan untuk santri..." className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-300 focus:outline-none resize-none" />
                            </div>
                          </div>

                          <div className="p-6 shrink-0 border-t border-slate-100 bg-white rounded-b-2xl">
                            {submitMsg && (
                              <div className={`mb-3 text-sm rounded-xl p-3 ${submitMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {submitMsg.msg}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button type="button" onClick={() => setSelectedSantri(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                Batal
                              </button>
                              <button type="submit" disabled={!kelancaran || !tajwid || !status || submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors">
                                {submitting ? 'Menyimpan...' : 'Submit Ujian'}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Sub-tab: Kenaikan Jilid (Iqra) ── */}
              {activeSubTab === 'jilid' && (
                <>
                  {pendingIqra.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                      <CheckCircle className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                      <h3 className="font-semibold text-slate-700">Tidak Ada Ujian Kenaikan Jilid Pending</h3>
                      <p className="text-slate-400 text-sm mt-1">Semua santri Iqra sudah lulus atau belum mencapai halaman terakhir jilid.</p>
                    </div>
                  ) : (
                    pendingIqra.map(p => (
                      <div key={p.santriId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-800">{p.santriNama}</h3>
                              {p.warningGagal && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" /> {p.gagalCount}× gagal
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">
                              Menunggu Ujian Kenaikan <span className="font-bold text-purple-700">Jilid {p.jilidIqraUjianPending}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedSantriIqra(p)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            Mulai Ujian <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Modal Form Ujian Iqra — jilid dikunci dari antrean */}
                  {selectedSantriIqra && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all overflow-y-auto">
                      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 max-w-md w-full animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
                        <div className="p-4 shrink-0 border-b border-slate-100">
                          <h2 className="text-lg font-bold text-slate-900">📖 Ujian Kenaikan Jilid {selectedSantriIqra.jilidIqraUjianPending}</h2>
                          <p className="text-slate-500 text-sm mt-0.5">Santri: <strong>{selectedSantriIqra.santriNama}</strong></p>
                          {selectedSantriIqra.warningGagal && (
                            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex gap-2 text-sm text-amber-800">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>Santri ini sudah gagal <strong>{selectedSantriIqra.gagalCount}×</strong> untuk jilid ini.</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <UjianIqraForm
                            santri={selectedSantriIqra}
                            jilidDiujiLocked={selectedSantriIqra.jilidIqraUjianPending}
                            onSubmit={async (payload) => {
                              const res = await createUjianIqra({ data: payload })
                              if (res.success) {
                                setSelectedSantriIqra(null)
                                await loadData()
                              }
                              return res as { success: boolean; error?: any }
                            }}
                          />
                        </div>
                        <div className="p-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedSantriIqra(null)}
                            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          )}

          {/* ── TAB RIWAYAT ── */}
          {activeTab === 'riwayat' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {riwayat.length === 0 ? (
                <div className="p-10 text-center text-slate-400">Belum ada riwayat ujian.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-left p-3 pl-4">Santri</th>
                      <th className="text-left p-3">Juz / Materi</th>
                      <th className="text-left p-3">Kelancaran</th>
                      <th className="text-left p-3">Tajwid</th>
                      <th className="text-left p-3">Skor</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riwayat.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 pl-4 font-semibold text-slate-800">{u.santriNama}</td>
                        <td className="p-3 text-slate-600 font-medium">
                          <div>Juz {u.juz}</div>
                          {u.cakupanMateri && <div className="text-xs font-normal text-slate-400 mt-0.5">{u.cakupanMateri}</div>}
                        </td>
                        <td className="p-3 text-slate-600 capitalize">{u.kelancaran}</td>
                        <td className="p-3 text-slate-600 capitalize">{u.tajwid}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-700">{u.skor}</span>
                          <span className="text-slate-400 text-xs">/100</span>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${warnaBadgeStatus(u.status)}`}>
                            {labelStatus(u.status)}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-xs">
                          {format(new Date(u.createdAt), 'd MMM yyyy', { locale: id })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

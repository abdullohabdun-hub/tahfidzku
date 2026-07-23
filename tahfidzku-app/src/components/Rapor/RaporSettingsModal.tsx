import { useState, useEffect } from 'react'
import { Settings, Save, Loader2, Building, AlignLeft, Image, MapPin, User, Hash, X } from 'lucide-react'
import { getRaporSettings, upsertRaporSettings } from '../../server-fns/rapor'
import { Button } from '../ui/button'

export function RaporSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [savingRapor, setSavingRapor] = useState(false)

  const [raporNamaLembaga, setRaporNamaLembaga] = useState('')
  const [raporAlamat, setRaporAlamat] = useState('')
  const [raporLogoUrl, setRaporLogoUrl] = useState('')
  const [raporKota, setRaporKota] = useState('')
  const [raporNamaMudir, setRaporNamaMudir] = useState('')
  const [raporNipMudir, setRaporNipMudir] = useState('')
  const [raporCatatanFooter, setRaporCatatanFooter] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  async function loadData() {
    setLoading(true)
    const raporRes = await getRaporSettings()
    if (raporRes.success && raporRes.data) {
      const d = raporRes.data
      setRaporNamaLembaga(d.namaLembaga ?? '')
      setRaporAlamat(d.alamatLembaga ?? '')
      setRaporLogoUrl(d.logoUrl ?? '')
      setRaporKota(d.kotaCetak ?? '')
      setRaporNamaMudir(d.namaMudir ?? '')
      setRaporNipMudir(d.nipMudir ?? '')
      setRaporCatatanFooter(d.catatanFooter ?? '')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">Pengaturan Rapor Digital</h2>
              <p className="text-xs text-slate-500">Sesuaikan kop surat dan tanda tangan.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="p-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setSavingRapor(true)
                const res = await upsertRaporSettings({
                  data: {
                    namaLembaga:   raporNamaLembaga || undefined,
                    alamatLembaga: raporAlamat      || undefined,
                    logoUrl:       raporLogoUrl     || undefined,
                    kotaCetak:     raporKota        || undefined,
                    namaMudir:     raporNamaMudir   || undefined,
                    nipMudir:      raporNipMudir    || undefined,
                    catatanFooter: raporCatatanFooter || undefined,
                  }
                })
                if (res.success) {
                  alert('Pengaturan rapor berhasil disimpan!')
                  onClose()
                } else {
                  alert(res.error?.message || 'Gagal menyimpan pengaturan rapor')
                }
                setSavingRapor(false)
              }}
              className="space-y-6"
            >
              {/* Kop Surat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    Nama Lembaga (untuk Kop Surat)
                  </label>
                  <input
                    value={raporNamaLembaga}
                    onChange={e => setRaporNamaLembaga(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Contoh: Pondok Pesantren Tahfidz Al-Furqon"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-slate-400" />
                    Alamat Lembaga
                  </label>
                  <textarea
                    rows={2}
                    value={raporAlamat}
                    onChange={e => setRaporAlamat(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                    placeholder="Jl. Contoh No. 1, Kota, Provinsi"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Image className="w-4 h-4 text-slate-400" />
                    URL Logo Lembaga
                  </label>
                  <input
                    type="url"
                    value={raporLogoUrl}
                    onChange={e => setRaporLogoUrl(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                  {raporLogoUrl && (
                    <div className="flex items-center gap-3 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <img src={raporLogoUrl} alt="Preview logo" className="h-12 w-12 object-contain rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <p className="text-xs text-slate-500">Pratinjau logo</p>
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Tanda Tangan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Kota Penandatanganan
                  </label>
                  <input
                    value={raporKota}
                    onChange={e => setRaporKota(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Contoh: Bandung"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Nama Pimpinan/Mudir
                  </label>
                  <input
                    value={raporNamaMudir}
                    onChange={e => setRaporNamaMudir(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ust. H. Ahmad Fauzan, Lc."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" />
                    NIP/No. Identitas Pimpinan <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <input
                    value={raporNipMudir}
                    onChange={e => setRaporNipMudir(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="19XXXXXXXXX"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-slate-400" />
                    Catatan Footer Rapor <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={raporCatatanFooter}
                    onChange={e => setRaporCatatanFooter(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                    placeholder="Contoh: Semoga Allah memudahkan perjalanan hafalan Ananda."
                  />
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={savingRapor}>
                  Batal
                </Button>
                <Button type="submit" disabled={savingRapor} className="bg-emerald-600 hover:bg-emerald-700 px-6">
                  {savingRapor ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Pengaturan
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

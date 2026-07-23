import { useState, useEffect } from 'react'
import { Save, Loader2, ListChecks } from 'lucide-react'
import { Button } from '../ui/button'
import { getRaporSettings, upsertRaporSettings } from '../../server-fns/rapor'

const DEFAULT_LABELS = {
  5: 'Mumtaz',
  4: 'Jayyid Jiddan',
  3: 'Jayyid',
  2: "Da'if",
  1: "Da'if Jiddan"
}

export function LabelPenilaianSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [labels, setLabels] = useState<Record<string, string>>(DEFAULT_LABELS)

  useEffect(() => {
    async function loadData() {
      const res = await getRaporSettings()
      if (res.success && res.data?.labelPenilaian) {
        setLabels({ ...DEFAULT_LABELS, ...res.data.labelPenilaian })
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await upsertRaporSettings({
      data: {
        labelPenilaian: labels
      }
    })
    if (res.success) {
      alert('Berhasil menyimpan istilah penilaian!')
    } else {
      alert(res.error?.message || 'Gagal menyimpan pengaturan')
    }
    setSaving(false)
  }

  if (loading) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden my-8">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center">
          <ListChecks className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800">Istilah Penilaian (Skor 1-5)</h3>
          <p className="text-xs text-slate-500">Sesuaikan istilah kelancaran hafalan dengan standar lembaga Anda.</p>
        </div>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[5, 4, 3, 2, 1].map((skor) => (
              <div key={skor} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 shrink-0">
                  {skor}
                </div>
                <input 
                  required
                  value={labels[skor] || ''}
                  onChange={e => setLabels(prev => ({ ...prev, [skor]: e.target.value }))}
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                  placeholder={`Contoh: ${DEFAULT_LABELS[skor as keyof typeof DEFAULT_LABELS]}`}
                />
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Istilah Penilaian
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

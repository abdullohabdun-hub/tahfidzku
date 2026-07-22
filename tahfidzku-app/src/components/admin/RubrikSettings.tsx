import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, ListTodo, AlertCircle, Save } from 'lucide-react'
import { getAllRubrikTenant, saveRubrik } from '../../server-fns/rubrik'
import { Button } from '../ui/button'

export function RubrikSettings() {
  const [loading, setLoading] = useState(true)
  const [rubriks, setRubriks] = useState<any[]>([])
  
  // State for form
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formKey, setFormKey] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formOpsi, setFormOpsi] = useState<{id?: string, value: string, label: string, poin?: number | null}[]>([])
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function loadData() {
    setLoading(true)
    const res = await getAllRubrikTenant()
    setRubriks(res || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateNew = () => {
    setEditingId(null)
    setFormKey('')
    setFormLabel('')
    setFormOpsi([
      { value: 'lancar', label: 'Lancar' },
      { value: 'mengulang', label: 'Mengulang' }
    ])
    setErrorMsg('')
    setIsFormOpen(true)
  }

  const handleEdit = (r: any) => {
    setEditingId(r.id)
    setFormKey(r.key)
    setFormLabel(r.label)
    setFormOpsi(r.opsi.map((o: any) => ({ id: o.id, value: o.value, label: o.label, poin: o.poin })))
    setErrorMsg('')
    setIsFormOpen(true)
  }

  const handleAddOpsi = () => {
    setFormOpsi([...formOpsi, { value: '', label: '' }])
  }

  const handleRemoveOpsi = (index: number) => {
    if (formOpsi.length <= 1) {
      alert("Minimal harus ada 1 opsi")
      return
    }
    const newOpsi = [...formOpsi]
    newOpsi.splice(index, 1)
    setFormOpsi(newOpsi)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    
    // Validasi basic
    if (!formKey.trim() || !formLabel.trim()) {
      setErrorMsg('Key dan Label dimensi wajib diisi')
      return
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(formKey)) {
      setErrorMsg('Key hanya boleh berisi huruf, angka, dan underscore (_). Contoh: tajwid_1')
      return
    }

    if (formOpsi.some(o => !o.value.trim() || !o.label.trim())) {
      setErrorMsg('Semua kolom opsi (Value & Label) wajib diisi')
      return
    }

    setSaving(true)
    try {
      // Siapkan payload
      const payload = {
        id: editingId || undefined,
        key: formKey,
        label: formLabel,
        opsi: formOpsi.map((o, i) => ({
          id: o.id,
          value: o.value,
          label: o.label,
          urutan: i + 1,
          poin: o.poin
        }))
      }

      await saveRubrik({ data: payload })
      
      setIsFormOpen(false)
      loadData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan rubrik')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-emerald-600">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-800">Kustomisasi Rubrik Penilaian</h3>
            <p className="text-xs text-slate-500">Atur dimensi dan pilihan nilai setoran untuk lembaga Anda.</p>
          </div>
        </div>
        {!isFormOpen && (
          <Button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700 h-9 px-4 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Dimensi
          </Button>
        )}
      </div>

      <div className="p-6">
        {isFormOpen ? (
          <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-5 mb-6">
            <h4 className="font-semibold text-slate-800 mb-4">{editingId ? 'Edit Dimensi Penilaian' : 'Buat Dimensi Penilaian Baru'}</h4>
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Label Dimensi
                  </label>
                  <input 
                    required 
                    value={formLabel} 
                    onChange={e => setFormLabel(e.target.value)} 
                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" 
                    placeholder="Contoh: Kualitas Hafalan" 
                  />
                  <p className="text-xs text-slate-500">Akan tampil di form Ustadz.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Key Database
                  </label>
                  <input 
                    required 
                    disabled={!!editingId} // Disabled saat edit
                    value={formKey} 
                    onChange={e => setFormKey(e.target.value)} 
                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm disabled:bg-slate-100 disabled:text-slate-500" 
                    placeholder="Contoh: kualitas" 
                  />
                  <p className="text-xs text-slate-500">Unik & tidak bisa diubah (a-z, _, tanpa spasi).</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Pilihan Nilai (Opsi)
                </label>
                <div className="space-y-2">
                  {formOpsi.map((o, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input 
                          required
                          value={o.label}
                          onChange={e => {
                            const newO = [...formOpsi];
                            newO[idx].label = e.target.value;
                            setFormOpsi(newO);
                          }}
                          placeholder="Label Opsi (Tampil di UI)"
                          className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          required
                          disabled={!!o.id} // Tidak bisa edit value kalau opsi sudah pernah disimpan, untuk keamanan data historis
                          value={o.value}
                          onChange={e => {
                            const newO = [...formOpsi];
                            newO[idx].value = e.target.value;
                            setFormOpsi(newO);
                          }}
                          placeholder="Value (Simpan di DB)"
                          className="w-full border border-slate-300 p-2.5 rounded-lg text-sm disabled:bg-slate-100"
                        />
                      </div>
                      <Button type="button" variant="outline" className="px-3" onClick={() => handleRemoveOpsi(idx)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-3 text-indigo-600 border-indigo-200" onClick={handleAddOpsi}>
                  + Tambah Opsi
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Batal</Button>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Dimensi
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {rubriks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Belum ada rubrik penilaian kustom.
              </div>
            ) : (
              rubriks.map(r => (
                <div key={r.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-800">{r.label}</h4>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex gap-2 items-center">
                        key: {r.key} 
                        {r.aktif ? (
                           <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Aktif</span>
                        ) : (
                           <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Nonaktif</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(r)} className="text-slate-400 hover:text-indigo-600">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.opsi?.map((o: any) => (
                      <div key={o.id} className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-600 flex gap-1 items-center">
                        <span className="font-medium text-slate-700">{o.label}</span>
                        <span className="text-slate-400">({o.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

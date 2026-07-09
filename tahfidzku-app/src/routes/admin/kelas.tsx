import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BookOpen, Plus, Loader2, Trash2, Edit } from 'lucide-react'
import { getKelasList, createKelas, deleteKelas, getUstadzList, updateKelas } from '../../server-fns/admin-functions'
import { Button } from '../../components/ui/button'

export const Route = createFileRoute('/admin/kelas')({
  component: DataKelasPage,
})

function DataKelasPage() {
  const [kelasList, setKelasList] = useState<any[]>([])
  const [ustadzList, setUstadzList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nama, setNama] = useState('')
  const [ustadzId, setUstadzId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    setLoading(true)
    const [resKelas, resUstadz] = await Promise.all([
      getKelasList(),
      getUstadzList()
    ])
    if (resKelas.success && resKelas.data) setKelasList(resKelas.data)
    if (resUstadz.success && resUstadz.data) setUstadzList(resUstadz.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = { data: { nama, ustadzId: ustadzId ? ustadzId : undefined } }
    
    let res;
    if (editingId) {
      res = await updateKelas({ data: { ...payload.data, id: editingId } })
    } else {
      res = await createKelas(payload)
    }
    
    if (res.success) {
      alert(res.message || 'Berhasil menyimpan data')
      handleCloseForm()
      loadData()
    } else {
      alert(res.error?.message || 'Gagal')
    }
    setSubmitting(false)
  }

  const handleEdit = (k: any) => {
    setEditingId(k.id)
    setNama(k.nama)
    setUstadzId(k.ustadzId || '')
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setNama('')
    setUstadzId('')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus kelas ini? (Santri di dalamnya akan kehilangan relasi kelas)')) {
      const res = await deleteKelas({ data: { id } })
      if (res.success) {
        loadData()
      } else {
        alert(res.error?.message || 'Gagal menghapus')
      }
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Kelas / Halaqoh</h2>
          <p className="text-slate-500">Kelompokkan santri dan tentukan pengajarnya.</p>
        </div>
        <Button onClick={() => { handleCloseForm(); setShowForm(!showForm) }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Kelas
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">{editingId ? 'Edit Kelas' : 'Form Tambah Kelas'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Kelas / Halaqoh</label>
              <input required value={nama} onChange={e => setNama(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Contoh: Halaqoh Utsman Bin Affan" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ustadz Penanggung Jawab</label>
              <select value={ustadzId} onChange={e => setUstadzId(e.target.value)} className="w-full border p-2 rounded-lg bg-white">
                <option value="">-- Pilih Ustadz --</option>
                {ustadzList.map(u => (
                  <option key={u.id} value={u.id}>{u.nama}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>Batal</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Nama Kelas</th>
                <th className="p-4 font-semibold text-slate-600">Ustadz Pengampu</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kelasList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-slate-500">Belum ada data kelas</td>
                </tr>
              ) : (
                kelasList.map(k => (
                  <tr key={k.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      {k.nama}
                    </td>
                    <td className="p-4 text-slate-600">
                      {k.ustadzNama ? <span className="font-medium text-emerald-700">Ust. {k.ustadzNama}</span> : <span className="text-slate-400 italic">Belum ada</span>}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(k)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(k.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { UserSquare2, Plus, Loader2, Trash2, Edit } from 'lucide-react'
import { getUstadzList, createUstadz, deleteUstadz, updateUstadz } from '../../server-fns/ustadz'
import { Button } from '../../components/ui/button'

export const Route = createFileRoute('/admin/ustadz')({
  component: DataUstadzPage,
})

function DataUstadzPage() {
  const [ustadz, setUstadz] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    setLoading(true)
    const res = await getUstadzList()
    if (res.success && res.data) {
      setUstadz(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    let res;
    if (editingId) {
      res = await updateUstadz({ data: { id: editingId, nama, email, password: password || undefined } })
    } else {
      res = await createUstadz({ data: { nama, email, password } })
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

  const handleEdit = (u: any) => {
    setEditingId(u.id)
    setNama(u.nama)
    setEmail(u.email)
    setPassword('') // Optional when editing
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setNama('')
    setEmail('')
    setPassword('')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data ustadz ini?')) {
      const res = await deleteUstadz({ data: { id } })
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Data Ustadz</h2>
          <p className="text-slate-500">Kelola akun dan profil muhaffizh pengajar.</p>
        </div>
        <Button onClick={() => { handleCloseForm(); setShowForm(!showForm) }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Ustadz
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">{editingId ? 'Edit Ustadz' : 'Form Tambah Ustadz'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
              <input required value={nama} onChange={e => setNama(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Ustadz Fulan" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username / Email / No HP</label>
              <input required value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="user_ustadz" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PIN / Password Login</label>
              <input required={!editingId} type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded-lg" placeholder={editingId ? "(Kosongkan jika tidak ingin ganti PIN)" : "Minimal 4 karakter"} />
            </div>
            <div className="flex gap-2">
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
                <th className="p-4 font-semibold text-slate-600">Nama Ustadz</th>
                <th className="p-4 font-semibold text-slate-600">Username/Email</th>
                <th className="p-4 font-semibold text-slate-600">Tanggal Gabung</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ustadz.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">Belum ada data ustadz</td>
                </tr>
              ) : (
                ustadz.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <UserSquare2 className="w-4 h-4" />
                      </div>
                      {u.nama}
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-sm">{u.email}</td>
                    <td className="p-4 text-slate-500 text-sm">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(u)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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

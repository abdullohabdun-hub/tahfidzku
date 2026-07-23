import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { UserSquare2, Plus, Loader2, Trash2, Edit, VenetianMask } from 'lucide-react'
import { getUstadzList, createUstadz, deleteUstadz, updateUstadz } from '../../server-fns/ustadz'
import { impersonateUser } from '../../server-fns/impersonate'
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
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [noWa, setNoWa] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Impersonate State
  const [impersonateTarget, setImpersonateTarget] = useState<any>(null)
  const [impersonating, setImpersonating] = useState(false)

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
      res = await updateUstadz({ data: { id: editingId, nama, username, email: email || undefined, noWa: noWa || undefined, password: password || undefined } })
    } else {
      res = await createUstadz({ data: { nama, username, email: email || undefined, noWa: noWa || undefined, password } })
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
    setUsername(u.username || '')
    setEmail(u.email || '')
    setNoWa(u.noWa || '')
    setPassword('') // Optional when editing
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setNama('')
    setUsername('')
    setEmail('')
    setNoWa('')
    setPassword('')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data ustadz ini?')) {
      const res = await deleteUstadz({ data: { id } })
      if (res.success) {
        loadData()
      }
      if (!res.success) {
        alert((res as any).error?.message || 'Gagal menghapus data')
      }
    }
  }

  const handleImpersonate = async () => {
    if (!impersonateTarget) return
    setImpersonating(true)
    const res = await impersonateUser({ data: { targetRole: 'ustadz', targetId: impersonateTarget.id } })
    setImpersonating(false)
    if (!res.success) {
      alert((res as any).error?.message || 'Gagal memulai mode menyamar')
      setImpersonateTarget(null)
      return
    }
    if (res.data) {
      window.location.href = res.data.redirectUrl
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
              <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
              <input required value={nama} onChange={e => setNama(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Ustadz Fulan" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username *</label>
              <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="username_ustadz" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email (Opsional)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="email@contoh.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">No. WhatsApp (Opsional)</label>
              <input value={noWa} onChange={e => setNoWa(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Misal: 0812345678" />
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

      {impersonateTarget && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Mode Menyamar</h3>
            <p className="text-slate-600 mb-6">
              Anda akan masuk ke dashboard sebagai <strong>{impersonateTarget.nama}</strong> (Ustadz). Anda dapat kembali ke mode Admin kapan saja melalui banner di atas layar. Lanjutkan?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setImpersonateTarget(null)} disabled={impersonating}>Batal</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleImpersonate} disabled={impersonating}>
                {impersonating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <VenetianMask className="w-4 h-4 mr-2" />}
                Ya, Lanjutkan
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>
        ) : (
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama Ustadz</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Kontak</th>
                <th className="px-4 py-3">Tanggal Gabung</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ustadz.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Belum ada data ustadz</td>
                </tr>
              ) : (
                ustadz.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <UserSquare2 className="w-4 h-4" />
                      </div>
                      {u.nama}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-sm">{u.username || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">
                      <div>{u.email || '-'}</div>
                      <div className="text-slate-400">{u.noWa || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(u)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50" title="Edit">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setImpersonateTarget(u)} className="text-orange-500 hover:text-orange-700 hover:bg-orange-50" title="Menyamar">
                        <VenetianMask className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Hapus">
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


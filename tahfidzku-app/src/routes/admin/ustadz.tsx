import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Loader2, VenetianMask, UserSquare2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { toast } from "../../components/ui/sonner"
import { RowActionsMenu } from "../../components/shared/RowActionsMenu"
import { getUstadzList, createUstadz, updateUstadz, deleteUstadz } from "../../server-fns/ustadz"
import { impersonateUser } from "../../server-fns/impersonate"
import { PageHeader } from "../../components/shared/PageHeader"

export const Route = createFileRoute('/admin/ustadz')({
  component: AdminUstadzPage,
})

function AdminUstadzPage() {
  const [ustadz, setUstadz] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [nama, setNama] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [noWa, setNoWa] = useState("")
  const [password, setPassword] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [impersonateTarget, setImpersonateTarget] = useState<any>(null)
  const [impersonating, setImpersonating] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getUstadzList()
      if (res.success && res.data) {
        setUstadz(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setNama("")
    setUsername("")
    setEmail("")
    setNoWa("")
    setPassword("")
    setIsAdmin(false)
  }

  const handleEdit = (u: any) => {
    setEditingId(u.id)
    setNama(u.nama || "")
    setUsername(u.username || "")
    setEmail(u.email || "")
    setNoWa(u.noWa || "")
    setPassword("")
    setIsAdmin(u.roles?.includes('admin') || false)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        const res = await updateUstadz({
          data: { id: editingId, nama, username, email: email || null, noWa: noWa || null, password: password || undefined, roles: isAdmin ? ['ustadz', 'admin'] : ['ustadz'] }
        })
        if (res.success) {
          toast.success("Berhasil mengedit data ustadz")
          handleCloseForm()
          loadData()
        } else {
          toast.error(res.error?.message || "Gagal mengedit data")
        }
      } else {
        const res = await createUstadz({
          data: { nama, username, email: email || null, noWa: noWa || null, password, roles: isAdmin ? ['ustadz', 'admin'] : ['ustadz'] }
        })
        if (res.success) {
          toast.success("Berhasil menambah ustadz baru")
          handleCloseForm()
          loadData()
        } else {
          toast.error(res.error?.message || "Gagal menambah ustadz")
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    // confirm() dihapus — AlertDialog dari RowActionsMenu menangani konfirmasi sebelum handler ini dipanggil
    try {
      const res = await deleteUstadz({ data: { id } })
      if (res.success) {
        toast.success("Akun ustadz berhasil dihapus")
        loadData()
      } else {
        toast.error((res as any).error?.message || "Gagal menghapus akun")
      }
    } catch (err) {
      toast.error("Terjadi kesalahan")
    }
  }

  const handleImpersonate = async () => {
    if (!impersonateTarget) return
    setImpersonating(true)
    try {
      const res = await impersonateUser({ data: { targetRole: "ustadz", targetId: impersonateTarget.id } })
      if (res.success && res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl
      } else {
        toast.error((res as any).error?.message || "Gagal melakukan impersonasi")
        setImpersonating(false)
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server")
      setImpersonating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      <PageHeader
        title="Data Ustadz"
        description="Kelola akun dan profil muhaffizh pengajar."
        action={
          <Button onClick={() => { handleCloseForm(); setShowForm(!showForm) }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Ustadz
          </Button>
        }
      />

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg text-slate-800 mb-4">{editingId ? 'Edit Ustadz' : 'Form Tambah Ustadz'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
              <input required value={nama} onChange={e => setNama(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Ustadz Fulan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
              <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="username_ustadz" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (Opsional)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="email@contoh.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp (Opsional)</label>
              <input value={noWa} onChange={e => setNoWa(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Misal: 0812345678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PIN / Password Login</label>
              <input required={!editingId} type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder={editingId ? "(Kosongkan jika tidak ingin ganti PIN)" : "Minimal 4 karakter"} />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 transition-colors" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Beri Akses Admin</span>
              </label>
              <p className="text-xs text-slate-500 mt-1 pl-6">Jika dicentang, akun ini akan dapat berpindah role ke halaman Admin.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>Batal</Button>
              <Button type="submit" disabled={submitting}>
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
            <p className="text-slate-600 text-sm mb-6">
              Anda akan masuk ke aplikasi dengan peran sebagai <strong className="text-slate-900">{impersonateTarget.nama}</strong>. Sesi Anda akan beralih sementara.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setImpersonateTarget(null)} disabled={impersonating}>Batal</Button>
              <Button className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={handleImpersonate} disabled={impersonating}>
                {impersonating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Lanjutkan Menyamar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama Ustadz</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Kontak</th>
                <th className="px-4 py-3">Tanggal Gabung</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ustadz.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Belum ada data ustadz</td>
                </tr>
              ) : (
                ustadz.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-3 text-slate-900">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 font-semibold">
                        <UserSquare2 className="w-4 h-4" />
                      </div>
                      {u.nama}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.username || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">
                      <div>{u.email || '-'}</div>
                      <div className="text-slate-400">{u.noWa || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-1">
                      {/* Menyamar: tetap ikon visible — punya custom modal konfirmasi sendiri */}
                      <Button variant="ghost" size="icon-sm" onClick={() => setImpersonateTarget(u)} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Menyamar sebagai ustadz" aria-label="Menyamar sebagai ustadz">
                        <VenetianMask className="w-4 h-4" />
                      </Button>
                      {/* Edit + Hapus masuk dropdown (AlertDialog konfirmasi untuk Hapus) */}
                      <RowActionsMenu
                        actions={[
                          {
                            label: "Edit",
                            icon: Edit,
                            onClick: () => handleEdit(u),
                          },
                          {
                            label: "Hapus",
                            icon: Trash2,
                            onClick: () => handleDelete(u.id),
                            variant: "destructive",
                            entityName: u.nama,
                          },
                        ]}
                      />
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


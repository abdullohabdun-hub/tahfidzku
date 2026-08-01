import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Users, Plus, Loader2, ShieldOff, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { getAdminsFn, deactivateAdminFn } from '../../../server-fns/admin-management'
import { Button } from '../../../components/ui/button'

export const Route = createFileRoute('/admin/kelola-admin/')({
  component: KelolaAdminPage,
})

function KelolaAdminPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deactivating, setDeactivating] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const res = await getAdminsFn()
    if (res.success && res.data) {
      setAdmins(res.data)
    } else {
      alert((!res.success ? res.error?.message : 'Gagal memuat daftar admin'))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeactivate = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan admin ${nama}? Admin ini tidak akan bisa login lagi.`)) return

    setDeactivating(id)
    const res = await deactivateAdminFn({ data: id })
    if (res.success) {
      alert('Admin berhasil dinonaktifkan')
      loadData()
    } else {
      alert((!res.success ? res.error?.message : 'Gagal menonaktifkan admin'))
    }
    setDeactivating(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-emerald-600">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Admin</h2>
          <p className="text-slate-500">Kelola akun administrator untuk lembaga Anda.</p>
        </div>
        <Link to="/admin/kelola-admin/tambah">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Admin Baru
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Kontak (Email / WA)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{admin.nama}</div>
                    <div className="text-xs text-slate-500">Dibuat: {new Date(admin.createdAt).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {admin.username}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="truncate max-w-[150px]">{admin.email}</div>
                    <div className="text-xs text-slate-500">{admin.noWa}</div>
                  </td>
                  <td className="px-4 py-3">
                    {admin.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {admin.isActive ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeactivate(admin.id, admin.nama)}
                        disabled={deactivating === admin.id}
                      >
                        {deactivating === admin.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4 mr-1.5" />}
                        Nonaktifkan
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Akun dinonaktifkan</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {admins.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Belum ada admin lain yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

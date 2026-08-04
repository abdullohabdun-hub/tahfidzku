import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Users, Plus, Loader2, ShieldOff, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { getAdminsFn, deactivateAdminFn } from '../../../server-fns/admin-management'
import { Button } from '../../../components/ui/button'
import { toast } from "../../../components/ui/sonner"
import { RowActionsMenu } from '../../../components/shared/RowActionsMenu'
import { PageHeader } from '../../../components/shared/PageHeader'

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
      toast.error((!res.success ? res.error?.message : 'Gagal memuat daftar admin') as string)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeactivate = async (id: string) => {
    // confirm() dihapus — AlertDialog dari RowActionsMenu menangani konfirmasi sebelum handler ini dipanggil
    setDeactivating(id)
    const res = await deactivateAdminFn({ data: id })
    if (res.success) {
      toast.success('Admin berhasil dinonaktifkan')
      loadData()
    } else {
      toast.error((!res.success ? res.error?.message : 'Gagal menonaktifkan admin') as string)
    }
    setDeactivating(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-primary">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Admin"
        description="Kelola akun administrator untuk lembaga Anda."
        action={
          <Link to="/admin/kelola-admin/tambah">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Tambah Admin Baru
            </Button>
          </Link>
        }
      />

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
                      <RowActionsMenu
                        actions={[
                          {
                            label: "Nonaktifkan",
                            icon: ShieldOff,
                            onClick: () => handleDeactivate(admin.id),
                            variant: "destructive",
                            entityName: admin.nama,
                            confirmTitle: "Konfirmasi Nonaktifkan Admin",
                            confirmDescription: `Admin ${admin.nama} akan dinonaktifkan dan tidak dapat login lagi. Data dan riwayat akun tidak dihapus — akun dapat diaktifkan kembali oleh superadmin jika diperlukan.`,
                            confirmActionLabel: "Nonaktifkan",
                          },
                        ]}
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">Akun nonaktif</span>
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

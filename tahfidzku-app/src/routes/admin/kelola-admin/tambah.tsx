import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react'
import { createAdminFn } from '../../../server-fns/admin-management'
import { Button } from '../../../components/ui/button'
import { toast } from "../../../components/ui/sonner"

export const Route = createFileRoute('/admin/kelola-admin/tambah')({
  component: TambahAdminPage,
})

function TambahAdminPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    email: '',
    noWa: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const res = await createAdminFn({ data: formData })
    if (res.success) {
      toast.success('Berhasil menambahkan admin baru')
      navigate({ to: '/admin/kelola-admin' })
    } else {
      toast.error((!res.success ? res.error?.message : 'Gagal menambahkan admin') as string)
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/admin/kelola-admin"
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Admin Baru</h2>
          <p className="text-slate-500">Buat akun admin untuk membantu mengelola lembaga.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Catatan Penting:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Admin baru yang dibuat akan langsung diminta untuk mengubah kata sandi default-nya saat login pertama kali.</li>
            <li>Pastikan Anda hanya memberikan akses admin kepada pihak yang berwenang.</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
            <input 
              name="nama"
              required 
              minLength={3}
              value={formData.nama} 
              onChange={handleChange}
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              placeholder="Contoh: Ahmad Abdullah" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <input 
                name="username"
                required
                minLength={3}
                value={formData.username} 
                onChange={handleChange}
                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono text-sm" 
                placeholder="ahmad_admin" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">No. WhatsApp</label>
              <input 
                name="noWa"
                required
                type="tel"
                minLength={9}
                value={formData.noWa} 
                onChange={handleChange}
                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono text-sm" 
                placeholder="081234567890" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email Aktif</label>
            <input 
              name="email"
              required
              type="email"
              value={formData.email} 
              onChange={handleChange}
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              placeholder="ahmad@email.com" 
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-sm font-semibold text-slate-700">Kata Sandi Default</label>
            <input 
              name="password"
              required
              type="password"
              minLength={8}
              value={formData.password} 
              onChange={handleChange}
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              placeholder="Minimal 8 karakter" 
            />
            <p className="text-xs text-slate-500">Kata sandi ini bersifat sementara. Admin akan diminta mengubahnya saat berhasil masuk.</p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
            <Link to="/admin/kelola-admin">
              <Button type="button" variant="outline" className="h-11 px-6">
                Batal
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="h-11 px-8">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan & Daftarkan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

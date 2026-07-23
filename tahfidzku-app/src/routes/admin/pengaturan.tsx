import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Settings, Save, Loader2, Building, Link as LinkIcon, FileText, MapPin, User, Hash, AlignLeft, Image } from 'lucide-react'
import { getTenantInfo, updateTenantInfo, runDbMigration } from '../../server-fns/admin-settings'
import { getRaporSettings, upsertRaporSettings } from '../../server-fns/rapor'
import { Button } from '../../components/ui/button'
import { LabelPenilaianSettings } from '../../components/admin/LabelPenilaianSettings'
import { ChangePasswordForm } from '../../components/ChangePasswordForm'

export const Route = createFileRoute('/admin/pengaturan')({
  component: PengaturanPage,
})

function PengaturanPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [namaLembaga, setNamaLembaga] = useState('')
  const [slug, setSlug] = useState('')

  // State Pengaturan Rapor
  const [raporNamaLembaga, setRaporNamaLembaga] = useState('')
  const [raporAlamat, setRaporAlamat] = useState('')
  const [raporLogoUrl, setRaporLogoUrl] = useState('')
  const [raporKota, setRaporKota] = useState('')
  const [raporNamaMudir, setRaporNamaMudir] = useState('')
  const [raporNipMudir, setRaporNipMudir] = useState('')
  const [raporCatatanFooter, setRaporCatatanFooter] = useState('')
  const [savingRapor, setSavingRapor] = useState(false)

  async function loadData() {
    setLoading(true)
    const res = await getTenantInfo()
    if (res.success && res.data) {
      setNamaLembaga(res.data.namaLembaga)
      setSlug(res.data.slug)
    }
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

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await updateTenantInfo({ data: { namaLembaga } })
    if (res.success) {
      alert('Berhasil memperbarui pengaturan lembaga')
    } else {
      alert(res.error?.message || 'Gagal menyimpan pengaturan')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-emerald-600">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Web</h2>
        <p className="text-slate-500">Kelola identitas dasar dari lembaga Anda.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-800">Profil Lembaga</h3>
            <p className="text-xs text-slate-500">Informasi yang akan dilihat oleh Wali Santri.</p>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                Nama Lembaga
              </label>
              <input 
                required 
                value={namaLembaga} 
                onChange={e => setNamaLembaga(e.target.value)} 
                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                placeholder="Contoh: Pesantren Tahfidz Al-Furqon" 
              />
              <p className="text-xs text-slate-500">Nama ini akan muncul di dashboard Ustadz dan laporan Wali Santri.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-slate-400" />
                Alamat URL (Slug)
              </label>
              <div className="flex bg-slate-100 border border-slate-200 rounded-lg overflow-hidden opacity-70 cursor-not-allowed">
                <div className="bg-slate-200 text-slate-500 px-3 py-3 border-r border-slate-300 text-sm font-medium">
                  tahfidzku.com/
                </div>
                <input 
                  disabled
                  value={slug} 
                  className="w-full bg-transparent p-3 text-slate-700 outline-none font-mono text-sm cursor-not-allowed" 
                />
              </div>
              <p className="text-xs text-slate-500">
                Alamat URL dikunci secara permanen agar tautan (link) yang sudah Anda bagikan kepada Ustadz dan Wali Santri tidak terputus/error di kemudian hari.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </div>
      </div>
      <LabelPenilaianSettings />

      {/* Pengaturan Rapor Digital sudah dipindah ke halaman Cetak Rapor */}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 mt-8">
        <h3 className="font-semibold text-lg text-slate-800 mb-2">Sistem Database</h3>
        <p className="text-xs text-slate-500 mb-4">Jika Anda mengalami masalah (bug) setelah pembaruan aplikasi, klik tombol di bawah ini untuk memastikan skema database sudah tersinkronisasi.</p>
        <Button 
          type="button" 
          variant="outline"
          onClick={async () => {
            if(confirm('Jalankan migrasi database sekarang?')) {
              const res = await runDbMigration()
              if(res.success) alert(res.data)
              else alert(res.error?.message)
            }
          }}
        >
          Sinkronisasi Database
        </Button>
      </div>

      <ChangePasswordForm role="admin" />
    </div>
  )
}

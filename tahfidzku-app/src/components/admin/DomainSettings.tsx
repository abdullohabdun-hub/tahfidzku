import { useState } from 'react'
import { Globe, Copy, Check, ExternalLink, Loader2, RefreshCw, Trash2, ShieldCheck, AlertCircle } from 'lucide-react'
import { addCustomDomain, checkCustomDomainStatus, removeCustomDomain } from '../../server-fns/tenant-domain'
import { sanitizeCustomDomainInput, isValidCustomDomain } from '../../lib/domain-utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from '../ui/sonner'

interface DomainSettingsProps {
  slug: string
  initialCustomDomain?: string | null
  initialCustomDomainStatus?: 'none' | 'pending' | 'active' | 'failed'
  initialCustomDomainVerifiedAt?: Date | string | null
  onDomainUpdated?: () => void
}

export function DomainSettings({
  slug,
  initialCustomDomain = null,
  initialCustomDomainStatus = 'none',
  initialCustomDomainVerifiedAt = null,
  onDomainUpdated,
}: DomainSettingsProps) {
  const [copiedSubdomain, setCopiedSubdomain] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [customDomain, setCustomDomain] = useState<string | null>(initialCustomDomain)
  const [domainStatus, setDomainStatus] = useState<'none' | 'pending' | 'active' | 'failed'>(initialCustomDomainStatus)

  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const subdomainUrl = `${slug}.tahfidzku.my.id`

  const handleCopySubdomain = () => {
    navigator.clipboard.writeText(`https://${subdomainUrl}`)
    setCopiedSubdomain(true)
    toast.success('Alamat subdomain disalin ke clipboard')
    setTimeout(() => setCopiedSubdomain(false), 2000)
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    const sanitized = sanitizeCustomDomainInput(domainInput)

    if (!sanitized) {
      toast.error('Masukkan nama domain yang valid')
      return
    }

    if (!isValidCustomDomain(sanitized)) {
      toast.error('Format domain tidak valid. Contoh yang benar: tahfidz.ponpesalfalah.sch.id')
      return
    }

    setSubmitting(true)
    try {
      const res = await addCustomDomain({ data: { domain: sanitized } })
      if (res.success && res.data) {
        setCustomDomain(res.data.domain)
        setDomainStatus(res.data.verified ? 'active' : 'pending')
        setDomainInput('')
        toast.success(res.message || 'Domain berhasil didaftarkan')
        if (onDomainUpdated) onDomainUpdated()
      } else if (!res.success) {
        toast.error(res.error.message || 'Gagal mendaftarkan domain')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mendaftarkan domain')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      const res = await checkCustomDomainStatus()
      if (res.success && res.data) {
        setDomainStatus(res.data.status as any)
        toast.success(res.message || 'Status domain berhasil diperbarui')
        if (onDomainUpdated) onDomainUpdated()
      } else if (!res.success) {
        toast.error(res.error.message || 'Gagal mengecek status domain')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mengecek status domain')
    } finally {
      setChecking(false)
    }
  }

  const handleRemoveDomain = async () => {
    setRemoving(true)
    try {
      const res = await removeCustomDomain()
      if (res.success) {
        setCustomDomain(null)
        setDomainStatus('none')
        setShowConfirmDelete(false)
        toast.success('Custom domain berhasil dihapus')
        if (onDomainUpdated) onDomainUpdated()
      } else {
        toast.error(res.error.message || 'Gagal menghapus domain')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menghapus domain')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800">Alamat Domain Lembaga</h3>
          <p className="text-xs text-slate-500">Kelola subdomain TahfidzKu dan custom domain milik lembaga Anda.</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Panel A: Info Subdomain */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 block">Subdomain TahfidzKu (Otomatis)</label>
          <div className="flex items-center gap-3 max-w-xl">
            <div className="flex-1 flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-800 overflow-x-auto">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span>https://{subdomainUrl}</span>
            </div>
            <Button type="button" variant="outline" onClick={handleCopySubdomain} className="h-11 px-4">
              {copiedSubdomain ? <Check className="w-4 h-4 text-emerald-600 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedSubdomain ? 'Tersalin' : 'Salin Alamat'}
            </Button>
          </div>
          <p className="text-xs text-slate-500">Alamat subdomain ini otomatis aktif begitu wildcard domain dikonfigurasi di sistem utama.</p>
        </div>

        <hr className="border-slate-100" />

        {/* Panel B: Custom Domain */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 block">Custom Domain Sendiri (Opsional)</label>
            <p className="text-xs text-slate-500">Gunakan domain milik lembaga Anda sendiri (contoh: <span className="font-mono text-slate-700">tahfidz.ponpesalfalah.sch.id</span>).</p>
          </div>

          {!customDomain ? (
            <form onSubmit={handleAddDomain} className="space-y-3 max-w-xl">
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder="Contoh: tahfidz.ponpesalfalah.sch.id"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="h-11 border-slate-200 rounded-xl text-sm"
                  required
                />
                <Button type="submit" disabled={submitting} className="h-11 px-6 shrink-0">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Daftarkan Domain
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 max-w-2xl">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-base text-slate-900">{customDomain}</span>
                    {domainStatus === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5" /> Aktif & Terverifikasi
                      </span>
                    )}
                    {domainStatus === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5" /> Menunggu Verifikasi DNS
                      </span>
                    )}
                    {domainStatus === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                        <AlertCircle className="w-3.5 h-3.5" /> Verifikasi Gagal
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={handleCheckStatus} disabled={checking} className="h-9 text-xs">
                      {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                      Cek Status Domain
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowConfirmDelete(true)} className="h-9 text-xs text-rose-600 hover:bg-rose-50">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Hapus Domain
                    </Button>
                  </div>
                </div>

                {domainStatus === 'pending' && (
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-amber-900 space-y-2">
                    <p className="font-semibold">Instruksi Pengaturan DNS Record:</p>
                    <p>Tambahkan <strong>CNAME Record</strong> di pengelola domain Anda (misal Rumahweb, Niagahoster, DomaiNesia):</p>
                    <div className="p-2 bg-white rounded border border-amber-200 font-mono text-[11px] space-y-1">
                      <div><strong>Nama / Host:</strong> {customDomain} (atau sub-label)</div>
                      <div><strong>Target / Canonical:</strong> <span className="text-emerald-700">cname.vercel-dns.com</span></div>
                    </div>
                    <p className="text-[11px] text-amber-700">Setelah menambahkan DNS record, klik tombol <strong>"Cek Status Domain"</strong> di atas. Proses propagasi DNS membutuhkan waktu 5–30 menit.</p>
                  </div>
                )}
              </div>

              {showConfirmDelete && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <p className="text-xs text-rose-800 font-medium">Apakah Anda yakin ingin menghapus custom domain <span className="font-mono font-bold">{customDomain}</span>?</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="destructive" onClick={handleRemoveDomain} disabled={removing} className="h-8 text-xs">
                      {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Ya, Hapus Sekarang
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowConfirmDelete(false)} className="h-8 text-xs">
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

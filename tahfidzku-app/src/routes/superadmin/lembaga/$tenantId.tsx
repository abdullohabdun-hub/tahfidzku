import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getTenantDetail, updateTenantStatus, updateTenantInfo } from '../../../server-fns/superadmin'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ArrowLeft, Ban, CheckCircle2, Save, Loader2, Clock } from 'lucide-react'

export const Route = createFileRoute('/superadmin/lembaga/$tenantId')({
  component: LembagaDetail,
})

function LembagaDetail() {
  const { tenantId } = Route.useParams()
  const router = useRouter()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // State for Edit Info
  const [email, setEmail] = useState('')
  const [noWa, setNoWa] = useState('')
  const [catatan, setCatatan] = useState('')

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  async function fetchDetail() {
    try {
      const res = await getTenantDetail({ data: { tenantId } })
      if (res.success && res.data) {
        setData(res.data)
        setEmail(res.data.tenant.email || '')
        setNoWa(res.data.tenant.noWa || '')
        setCatatan(res.data.tenant.catatan || '')
      } else {
        setError(res.error?.message || 'Gagal memuat detail')
      }
    } catch (err: any) {
      setError(err.message || 'Error jaringan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [tenantId])

  const handleUpdateStatus = async (status: 'aktif' | 'suspend' | 'trial', catatanLog?: string) => {
    setActionLoading(true)
    setActionError('')
    setActionSuccess('')
    try {
      const res = await updateTenantStatus({ data: { tenantId, status, catatan: catatanLog } })
      if (res.success) {
        await fetchDetail()
        setActionSuccess('Status berhasil diubah')
      } else {
        setActionError(res.error?.message || 'Gagal mengubah status')
      }
    } catch (err: any) {
      setActionError(err.message || 'Error jaringan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateInfo = async () => {
    setActionLoading(true)
    setActionError('')
    setActionSuccess('')
    try {
      const res = await updateTenantInfo({ data: { tenantId, email, noWa, catatan } })
      if (res.success) {
        await fetchDetail()
        setActionSuccess('Informasi berhasil disimpan')
      } else {
        setActionError(res.error?.message || 'Gagal menyimpan informasi')
      }
    } catch (err: any) {
      setActionError(err.message || 'Error jaringan')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat detail...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!data) return null

  const { tenant, stats, logs } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tenant.namaLembaga}</h1>
          <p className="text-slate-500">Slug: {tenant.slug}</p>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            tenant.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' :
            tenant.status === 'trial' ? 'bg-amber-100 text-amber-700' :
            tenant.status === 'pending' ? 'bg-red-100 text-red-700' :
            tenant.status === 'suspend' ? 'bg-rose-100 text-rose-700' :
            tenant.status === 'rejected' ? 'bg-slate-200 text-slate-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {tenant.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Stats & Manajemen Status */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistik Lembaga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-slate-500">Total Santri</span>
                <span className="font-bold">{stats.totalSantri}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-slate-500">Setoran (30 Hari)</span>
                <span className="font-bold">{stats.setoran30Hari}</span>
              </div>
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-xs text-slate-400">Aktivitas Terakhir</span>
                <span className="text-sm font-medium">
                  {tenant.lastActiveAt ? format(new Date(tenant.lastActiveAt), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-xs text-slate-400">Terdaftar Sejak</span>
                <span className="text-sm font-medium">
                  {format(new Date(tenant.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100">
            <CardHeader className="bg-red-50/50 pb-4">
              <CardTitle className="text-lg text-red-900">Tindakan Bahaya</CardTitle>
              <CardDescription>Manajemen akses ke seluruh layanan</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {tenant.status === 'pending' ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Lembaga ini baru mendaftar dan menunggu persetujuan Anda.</p>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={() => {
                      if(confirm('Yakin ingin menyetujui lembaga ini (Mulai Trial 14 Hari)? Mereka akan mendapat email notifikasi.')) {
                        handleUpdateStatus('trial', 'Disetujui oleh Superadmin')
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Setujui (Mulai Trial 14 Hari)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" 
                    onClick={() => {
                      const alasan = prompt('Alasan penolakan (opsional, akan dikirim ke email mereka):')
                      if (alasan !== null) {
                        handleUpdateStatus('rejected', alasan)
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <Ban className="w-4 h-4 mr-2" /> Tolak Pendaftaran
                  </Button>
                </div>
              ) : tenant.status === 'suspend' ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Lembaga sedang ditangguhkan. Semua admin, ustadz, dan santri tidak dapat login.</p>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={() => handleUpdateStatus('aktif', 'Diaktifkan kembali oleh Super Admin')}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Pulihkan Akses (Aktifkan)
                  </Button>
                </div>
              ) : tenant.status === 'rejected' ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Pendaftaran lembaga ini telah Anda tolak. Anda dapat membatalkannya dengan menyetujui ulang.</p>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={() => {
                      if(confirm('Yakin ingin menyetujui lembaga ini?')) {
                        handleUpdateStatus('trial', 'Disetujui ulang oleh Superadmin')
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Setujui & Beri Trial
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Menangguhkan lembaga akan langsung memutus akses login untuk seluruh pengguna di lembaga ini.</p>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white" 
                    onClick={() => {
                      if(confirm('Yakin ingin menangguhkan seluruh akses lembaga ini?')) {
                        handleUpdateStatus('suspend', 'Ditangguhkan oleh Super Admin')
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <Ban className="w-4 h-4 mr-2" /> Suspend Akses Lembaga
                  </Button>
                  
                  {tenant.status === 'trial' && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50" 
                      onClick={() => handleUpdateStatus('aktif', 'Upgrade dari Trial ke Aktif')}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Set Sebagai Aktif
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail & Logs */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kontak & Catatan</CardTitle>
              <CardDescription>Informasi PIC/Admin untuk penagihan atau komunikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{actionError}</div>
              )}
              {actionSuccess && (
                <div className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">{actionSuccess}</div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Kontak</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email admin lembaga..." />
                </div>
                <div className="space-y-2">
                  <Label>No WhatsApp</Label>
                  <Input value={noWa} onChange={e => setNoWa(e.target.value)} placeholder="No WA admin..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Catatan Internal (Hanya Super Admin)</Label>
                <textarea 
                  value={catatan} 
                  onChange={e => setCatatan(e.target.value)} 
                  placeholder="Catat riwayat pembayaran, SLA, keluhan, dll..."
                  className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t justify-end pt-4 pb-4">
              <Button 
                className="bg-slate-900 text-white hover:bg-slate-800"
                onClick={handleUpdateInfo} 
                disabled={actionLoading || (email === (tenant.email||'') && noWa === (tenant.noWa||'') && catatan === (tenant.catatan||''))}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Status & Billing</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">Belum ada riwayat perubahan status.</p>
              ) : (
                <div className="space-y-4">
                  {logs.map((log: any) => (
                    <div key={log.id} className="flex gap-4 p-4 border rounded-xl bg-slate-50/50">
                      <div className="mt-0.5">
                        {log.action === 'suspend' ? <Ban className="w-5 h-5 text-red-500" /> : 
                         log.action === 'aktifkan' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
                         <Clock className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm capitalize">{log.action.replace('_', ' ')}</p>
                          <span className="text-xs text-slate-400">{format(new Date(log.createdAt), 'dd MMM yy HH:mm', { locale: id })}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Status: <span className="line-through text-slate-400">{log.statusBefore || 'baru'}</span> ➜ <strong>{log.statusAfter}</strong>
                        </p>
                        {log.catatan && (
                          <p className="text-xs text-slate-500 mt-2 bg-white p-2 rounded border border-slate-100 shadow-sm">"{log.catatan}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

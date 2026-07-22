import { createFileRoute } from '@tanstack/react-router'
import { getSuperAdminStats } from '../../server-fns/superadmin'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Building2, CheckCircle2, Ban, Clock, Users, FileText, AlertCircle, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/superadmin/')({
  component: SuperAdminDashboard,
})

function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await getSuperAdminStats()
        if (res.success && res.data) {
          setStats(res.data)
        } else {
          setError((res as any).error?.message || 'Gagal memuat statistik')
        }
      } catch (err: any) {
        setError(err.message || 'Error jaringan')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat statistik...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!stats) return null

  return (
    <div className="space-y-8 pb-12">
      {stats.pendingCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Ada {stats.pendingCount} Lembaga Baru Menunggu Persetujuan!</p>
              <p className="text-xs text-red-600/80 mt-0.5">Segera tinjau pendaftaran lembaga baru agar mereka bisa mulai menggunakan sistem.</p>
            </div>
          </div>
          <Link to="/superadmin/lembaga" className="shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
            Tinjau Sekarang <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview Sistem</h1>
        <p className="text-slate-500 mt-1">Status dan metrik lintas lembaga secara real-time.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
        {/* Card: Pending */}
        <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-600/80 tracking-wide uppercase">Menunggu</p>
              <h3 className="text-3xl font-bold text-red-600 mt-2 tracking-tight">{stats.pendingCount || 0}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100/50">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        {/* Card 1: Total Lembaga */}
        <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">Total Lembaga</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{stats.totalLembaga}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100/50">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>
        
        {/* Card 2: Aktif */}
        <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-emerald-600/80 tracking-wide uppercase">Aktif</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-2 tracking-tight">{stats.aktif}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Card 3: Trial */}
        <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-amber-600/80 tracking-wide uppercase">Trial</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-2 tracking-tight">{stats.trial}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Card 4: Suspend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-rose-600/80 tracking-wide uppercase">Suspend</p>
              <h3 className="text-3xl font-bold text-rose-600 mt-2 tracking-tight">{stats.suspend}</h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100/50">
              <Ban className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-lg text-slate-800">Aktivitas & Metrik Global</h3>
             </div>
             <div className="grid gap-6 sm:grid-cols-2">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-500">Total Santri Terdaftar</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{stats.totalSantri}</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-500">Setoran Hari Ini</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{stats.setoranHariIni}</div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="space-y-6">
           <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 h-full">
             <h3 className="font-bold text-lg text-slate-800 mb-4">Akses Cepat</h3>
             <div className="space-y-3">
               <a href="/superadmin/lembaga" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
                 <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-emerald-200 transition-colors">
                   <Building2 className="w-4 h-4 text-emerald-700" />
                 </div>
                 <div>
                   <p className="font-medium text-sm text-slate-800">Kelola Lembaga</p>
                   <p className="text-xs text-slate-500">Atur status & data lembaga</p>
                 </div>
               </a>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}

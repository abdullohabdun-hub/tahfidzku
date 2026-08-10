import { createFileRoute } from '@tanstack/react-router'
import { getSuperAdminStats } from '../../server-fns/superadmin'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Building2, CheckCircle2, Ban, Clock, Users, FileText, AlertCircle, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { StatCard } from '../../components/shared/StatCard'

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

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Memuat data overview...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview Sistem</h1>
        <p className="text-slate-500 mt-1">Status dan metrik lintas lembaga secara real-time.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Menunggu"
          value={stats.pendingCount || 0}
          unit="lembaga"
          badge={stats.pendingCount > 0 ? "Perlu Akses" : undefined}
          badgeVariant={stats.pendingCount > 0 ? "rose" : "slate"}
          icon={AlertCircle}
          tone={stats.pendingCount > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Total Lembaga"
          value={stats.totalLembaga}
          icon={Building2}
          tone="neutral"
        />
        <StatCard
          label="Aktif"
          value={stats.aktif}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Trial"
          value={stats.trial}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Suspend"
          value={stats.suspend}
          icon={Ban}
          tone={stats.suspend > 0 ? "danger" : "neutral"}
        />
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

import { createFileRoute, Link } from '@tanstack/react-router'
import { getAllTenants } from '../../../server-fns/superadmin'
import { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/card'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export const Route = createFileRoute('/superadmin/lembaga/')({
  component: LembagaList,
})

function LembagaList() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'trial' | 'aktif' | 'suspend' | 'rejected'>('all')

  useEffect(() => {
    async function fetchTenants() {
      try {
        const res = await getAllTenants()
        if (res.success && res.data) {
          setTenants(res.data)
        } else {
          setError(res.error?.message || 'Gagal memuat data')
        }
      } catch (err: any) {
        setError(err.message || 'Error jaringan')
      } finally {
        setLoading(false)
      }
    }
    fetchTenants()
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data lembaga...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Lembaga</h1>
          <p className="text-slate-500 mt-1">Daftar semua lembaga yang terdaftar di sistem.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'pending', label: 'Menunggu Persetujuan' },
          { id: 'trial', label: 'Trial' },
          { id: 'aktif', label: 'Aktif' },
          { id: 'suspend', label: 'Suspend' },
          { id: 'rejected', label: 'Ditolak' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={\`px-4 py-2 text-sm font-medium border-b-2 transition-colors \${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }\`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lembaga</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Terdaftar Sejak</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktivitas Terakhir</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.filter(t => activeTab === 'all' || t.status === activeTab).map(tenant => (
                <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{tenant.namaLembaga}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                    {tenant.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                      tenant.status === 'aktif' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                      tenant.status === 'trial' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' :
                      tenant.status === 'suspend' ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20' :
                      tenant.status === 'pending' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                      tenant.status === 'rejected' ? 'bg-slate-200 text-slate-700 ring-1 ring-inset ring-slate-600/20' :
                      'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {format(new Date(tenant.createdAt), 'dd MMM yyyy', { locale: id })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {tenant.lastActiveAt 
                      ? format(new Date(tenant.lastActiveAt), 'dd/MM/yy HH:mm')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link 
                      to="/superadmin/lembaga/$tenantId"
                      params={{ tenantId: tenant.id }}
                      className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Belum ada lembaga terdaftar.
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

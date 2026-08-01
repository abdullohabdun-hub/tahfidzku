import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Filter, Plus, TicketIcon } from 'lucide-react'

type TiketItem = {
  id: string
  subject: string
  kategori: string
  status: 'baru' | 'diproses' | 'selesai'
  createdAt: string | Date
  submitterRole: string
  submitterId: string
}

type TiketListProps = {
  tiket: TiketItem[]
  userRole: string
  userId: string
  baseUrl: string
  onNewTicketClick?: () => void
}

export function TiketList({ tiket, userRole, userId, baseUrl, onNewTicketClick }: TiketListProps) {
  const [activeTab, setActiveTab] = useState<'masuk' | 'saya'>('masuk')
  const [statusFilter, setStatusFilter] = useState<string>('semua')

  // Filter based on tabs (Only applicable if user is admin)
  const filteredByTab = tiket.filter((t) => {
    if (userRole !== 'admin') return true // Superadmin, Ustadz, Santri, Wali don't use tabs
    
    if (activeTab === 'saya') {
      return t.submitterId === userId
    } else {
      return t.submitterId !== userId
    }
  })

  // Filter based on status dropdown
  const displayedTiket = filteredByTab.filter((t) => {
    if (statusFilter === 'semua') return true
    return t.status === statusFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'baru':
        return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Baru</span>
      case 'diproses':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Diproses</span>
      case 'selesai':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Selesai</span>
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">{status}</span>
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="semua">Semua Status</option>
              <option value="baru">Baru</option>
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        
        {onNewTicketClick && (
          <button 
            onClick={onNewTicketClick}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Tiket Baru
          </button>
        )}
      </div>

      {/* Tabs for Admin */}
      {userRole === 'admin' && (
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-full max-w-sm">
          <button
            onClick={() => setActiveTab('masuk')}
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'masuk' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Laporan Masuk
          </button>
          <button
            onClick={() => setActiveTab('saya')}
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'saya' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Tiket Saya
          </button>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {displayedTiket.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <TicketIcon className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-medium">Tidak ada tiket</h3>
            <p className="text-slate-500 text-sm mt-1">Belum ada data tiket yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedTiket.map((t) => (
              <Link 
                key={t.id} 
                to={(`${baseUrl}/$tiketId`) as any}
                params={({ tiketId: t.id }) as any}
                className="block p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.submitterRole}</span>
                      {getStatusBadge(t.status)}
                      <span className="px-2 py-0.5 rounded border border-slate-200 text-slate-600 text-[10px] font-medium capitalize bg-white">{t.kategori}</span>
                    </div>
                    <h4 className="text-slate-900 font-medium truncate">{t.subject}</h4>
                  </div>
                  <div className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                    {format(new Date(t.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

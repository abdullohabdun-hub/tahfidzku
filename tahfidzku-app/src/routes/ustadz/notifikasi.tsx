import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { getNotifikasi, tandaiDibaca } from '../../server-fns/notifikasi-ustadz'
import { useState, useEffect } from 'react'
import { Bell, Check, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export const Route = createFileRoute('/ustadz/notifikasi')({
  component: NotifikasiPage,
})

function NotifikasiPage() {
  const router = useRouter()
  const fetchNotifikasi = useServerFn(getNotifikasi)
  const markAsRead = useServerFn(tandaiDibaca)
  
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState(0)
  const [nextCursor, setNextCursor] = useState<number | null>(null)

  useEffect(() => {
    loadData(0)
  }, [])

  const loadData = async (currentCursor: number) => {
    try {
      setLoading(true)
      const res = await fetchNotifikasi({ data: { cursor: currentCursor, limit: 20 } })
      if (res.success && res.data) {
        if (currentCursor === 0) {
          setItems(res.data.items)
        } else {
          setItems(prev => [...prev, ...res.data.items])
        }
        setNextCursor(res.data.nextCursor)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (nextCursor !== null) {
      setCursor(nextCursor)
      loadData(nextCursor)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAsRead({ data: {} })
      // Update local state to reflect all are read
      setItems(prev => prev.map(item => ({
        ...item,
        notifikasi: { ...item.notifikasi, dibacaPada: new Date().toISOString() }
      })))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifikasi</h1>
          <p className="text-sm text-slate-500">Pemberitahuan setoran santri dan aktivitas lainnya</p>
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="text-sm flex items-center gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
        >
          <Check className="w-4 h-4" />
          Tandai semua dibaca
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Belum ada notifikasi saat ini.</p>
          </div>
        )}

        {items.map((item, i) => {
          const notif = item.notifikasi
          const isUnread = !notif.dibacaPada
          
          return (
            <Link 
              to={notif.setoranId ? `/ustadz/setoran/${notif.setoranId}` as any : '/ustadz/notifikasi'}
              key={notif.id || i}
              className={`block p-4 rounded-xl border transition-all ${isUnread ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm'}`}
            >
              <div className="flex gap-4">
                <div className={`mt-1 p-2 rounded-full h-fit ${isUnread ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                      {notif.pesan}
                    </p>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(new Date(notif.dibuatPada), "d MMMM yyyy 'pukul' HH:mm", { locale: id })}
                  </p>
                </div>
                <div className="flex items-center text-slate-300">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          )
        })}

        {loading && (
          <div className="py-4 text-center">
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        )}

        {nextCursor !== null && !loading && (
          <div className="pt-2 text-center">
            <button 
              onClick={loadMore}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 py-2 px-4 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Muat lebih banyak
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

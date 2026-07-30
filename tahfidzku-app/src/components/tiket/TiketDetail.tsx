import { useState, useRef, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Send, AlertCircle, ArrowLeft } from 'lucide-react'
import { replyTiketFn, updateTiketStatusFn } from '../../server-fns/tiket'
import { Button } from '../ui/button'

type TiketData = {
  id: string
  subject: string
  message: string
  status: 'baru' | 'diproses' | 'selesai'
  createdAt: string | Date
  submitterRole: string
  tenantId: string
  submitterId: string
}

type BalasanData = {
  id: string
  authorRole: string
  authorId: string
  pesan: string
  createdAt: string | Date
}

type TiketDetailProps = {
  tiket: TiketData
  balasan: BalasanData[]
  userRole: string
  userId: string
  tenantId: string
  onBack: () => void
}

export function TiketDetail({ tiket, balasan, userRole, userId, tenantId, onBack }: TiketDetailProps) {
  const router = useRouter()
  const replyTiket = useServerFn(replyTiketFn)
  const updateStatus = useServerFn(updateTiketStatusFn)
  
  const [pesan, setPesan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [error, setError] = useState('')

  const threadEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when new message arrives
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [balasan])

  // Cek apakah user berwenang update status
  const canUpdateStatus = 
    userRole === 'superadmin' || 
    (userRole === 'admin' && tiket.tenantId === tenantId && ['santri', 'wali', 'ustadz'].includes(tiket.submitterRole))

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pesan.trim()) return

    setIsSubmitting(true)
    setError('')
    try {
      const res = await replyTiket({ data: { tiketId: tiket.id, pesan } })
      if (!res.success) throw new Error((res as any).error?.message || 'Gagal mengirim balasan')
      
      setPesan('')
      router.invalidate()
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim balasan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus: 'baru' | 'diproses' | 'selesai') => {
    if (!canUpdateStatus) return
    if (newStatus === tiket.status) return

    setIsUpdatingStatus(true)
    try {
      const res = await updateStatus({ data: { tiketId: tiket.id, status: newStatus } })
      if (!res.success) throw new Error((res as any).error?.message || 'Gagal merubah status')
      router.invalidate()
    } catch (err: any) {
      alert(err.message || 'Gagal merubah status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'baru':
        return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Baru</span>
      case 'diproses':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Diproses</span>
      case 'selesai':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Selesai</span>
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[600px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
      
      {/* Header Tiket */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <button onClick={onBack} className="flex items-center text-sm text-slate-500 hover:text-emerald-600 mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Daftar
        </button>
        
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{tiket.submitterRole}</span>
              {getStatusBadge(tiket.status)}
            </div>
            <h3 className="font-bold text-slate-900 text-lg">{tiket.subject}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {format(new Date(tiket.createdAt), "dd MMMM yyyy HH:mm", { locale: id })}
            </p>
          </div>

          {canUpdateStatus && (
            <select
              value={tiket.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              disabled={isUpdatingStatus}
              className="appearance-none bg-white border border-slate-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
              <option value="baru">Status: Baru</option>
              <option value="diproses">Status: Diproses</option>
              <option value="selesai">Status: Selesai</option>
            </select>
          )}
        </div>
      </div>

      {/* Thread Balasan (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white custom-scrollbar">
        {/* Pesan Utama */}
        <div className="flex flex-col items-start max-w-[85%]">
          <span className="text-xs text-slate-500 mb-1 ml-1 capitalize">{tiket.submitterRole}</span>
          <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap">
            {tiket.message}
          </div>
        </div>

        {/* List Balasan */}
        {balasan.map((b) => {
          const isOwn = b.authorId === userId
          const isAdminRole = ['admin', 'superadmin'].includes(b.authorRole)

          return (
            <div key={b.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-xs capitalize ${isAdminRole && !isOwn ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                  {b.authorRole}
                </span>
                <span className="text-[10px] text-slate-400">
                  {format(new Date(b.createdAt), "HH:mm")}
                </span>
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                isOwn 
                  ? 'bg-emerald-600 text-white rounded-tr-sm' 
                  : isAdminRole 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-tl-sm' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
              }`}>
                {b.pesan}
              </div>
            </div>
          )
        })}
        
        <div ref={threadEndRef} />
      </div>

      {/* Input Balasan */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        {error && (
          <div className="flex items-center gap-1.5 text-rose-600 text-xs mb-2 bg-rose-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" /> {error}
          </div>
        )}
        
        {tiket.status === 'selesai' ? (
          <div className="text-center py-2 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
            Tiket ini sudah ditandai selesai.
          </div>
        ) : (
          <form onSubmit={handleReply} className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                placeholder="Tulis balasan..."
                className="w-full resize-none bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm transition-colors"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = '44px'
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                }}
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply(e)
                  }
                }}
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !pesan.trim()}
              className="rounded-full w-11 h-11 p-0 shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </form>
        )}
      </div>

    </div>
  )
}

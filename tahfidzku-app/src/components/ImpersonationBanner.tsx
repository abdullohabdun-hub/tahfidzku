import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { VenetianMask, Loader2 } from 'lucide-react'
import { stopImpersonating } from '../server-fns/impersonate'
import { Button } from './ui/button'

interface Props {
  namaTarget: string
  roleTarget: string
  expiresAt?: number
}

export function ImpersonationBanner({ namaTarget, roleTarget, expiresAt }: Props) {
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    if (!expiresAt) return

    const timer = setInterval(() => {
      const now = Date.now()
      const diff = expiresAt - now
      if (diff <= 0) {
        setTimeLeft('Sesi Berakhir')
        clearInterval(timer)
        // Redirect to login if expired (handled by server on next action)
      } else {
        const m = Math.floor(diff / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [expiresAt])

  const handleStop = async () => {
    setLoading(true)
    const res = await stopImpersonating()
    setLoading(false)
    if (!res.success) {
      alert(res.error.message || 'Gagal menghentikan mode menyamar')
      if (res.error.message?.includes('dicabut')) {
        window.location.href = '/login'
      }
      return
    }
    if (res.data) {
      // Force reload to clear client-side states
      window.location.href = res.data.redirectUrl
    }
  }

  return (
    <div className="bg-orange-500 text-white shadow-md z-[9999] relative">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium">
          <VenetianMask className="w-4 h-4" />
          <span className="hidden sm:inline">Mode Menyamar Aktif:</span>
          Anda sedang melihat sebagai <strong>{namaTarget}</strong> ({roleTarget})
        </div>
        
        <div className="flex items-center gap-4">
          {timeLeft && (
            <div className="font-mono bg-orange-600 px-2 py-0.5 rounded text-xs">
              ⏱ {timeLeft}
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStop}
            disabled={loading}
            className="text-orange-600 bg-white hover:bg-orange-50 border-white h-7 text-xs font-semibold"
          >
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Kembali ke Admin
          </Button>
        </div>
      </div>
    </div>
  )
}

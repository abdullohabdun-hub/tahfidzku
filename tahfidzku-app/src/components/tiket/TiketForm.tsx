import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { createTiketFn } from '../../server-fns/tiket'
import { Button } from '../ui/button'

export function TiketForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const createTiket = useServerFn(createTiketFn)
  
  const [subject, setSubject] = useState('')
  const [kategori, setKategori] = useState<'bug' | 'fitur' | 'pertanyaan' | 'lainnya'>('pertanyaan')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!subject.trim()) {
      setError('Subjek tidak boleh kosong')
      return
    }
    if (!message.trim()) {
      setError('Pesan tidak boleh kosong')
      return
    }
    
    setIsSubmitting(true)
    try {
      const res = await createTiket({ data: { subject, kategori, message } })
      if (!res.success) {
        throw new Error((res as any).error?.message || 'Gagal membuat tiket')
      }
      
      setSubject('')
      setKategori('pertanyaan')
      setMessage('')
      onSuccess()
      router.invalidate()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
      {error && (
        <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-200">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">Subjek</label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={150}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          placeholder="Judul singkat pengaduan/pertanyaan"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label htmlFor="kategori" className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
        <select
          id="kategori"
          value={kategori}
          onChange={(e) => setKategori(e.target.value as any)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
          disabled={isSubmitting}
        >
          <option value="bug">Laporan Bug / Error</option>
          <option value="fitur">Permintaan Fitur</option>
          <option value="pertanyaan">Pertanyaan</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Pesan / Detail</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-none"
          placeholder="Jelaskan detail pengaduan atau pertanyaan Anda di sini..."
          disabled={isSubmitting}
        />
        <div className="text-right mt-1 text-xs text-slate-500">
          {message.length}/2000
        </div>
      </div>
      
      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim Tiket'}
        </Button>
      </div>
    </form>
  )
}

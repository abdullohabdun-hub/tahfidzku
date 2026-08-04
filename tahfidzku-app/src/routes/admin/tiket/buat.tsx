import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { TiketForm } from '../../../components/tiket/TiketForm'

export const Route = createFileRoute('/admin/tiket/buat')({
  component: AdminTiketBuat,
})

function AdminTiketBuat() {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => router.history.back()}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Buat Tiket Baru</h2>
          <p className="text-slate-500 text-sm mt-1">Sampaikan pertanyaan atau kendala Anda</p>
        </div>
      </div>
      
      <TiketForm onSuccess={() => router.navigate({ to: '/admin/tiket' })} />
    </div>
  )
}

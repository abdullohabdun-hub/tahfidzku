import { createFileRoute } from '@tanstack/react-router'
import { History } from 'lucide-react'

export const Route = createFileRoute('/ustadz/riwayat')({
  component: RiwayatPage,
})

function RiwayatPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
        <History className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Riwayat Setoran (Segera Hadir)</h2>
      <p className="text-slate-500 max-w-sm">
        Daftar lengkap riwayat setoran santri akan ditampilkan di halaman ini.
      </p>
    </div>
  )
}

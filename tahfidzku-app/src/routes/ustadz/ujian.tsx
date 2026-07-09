import { createFileRoute } from '@tanstack/react-router'
import { Construction } from 'lucide-react'

export const Route = createFileRoute('/ustadz/ujian')({
  component: UjianPage,
})

function UjianPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
        <Construction className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Fitur Ujian (Segera Hadir)</h2>
      <p className="text-slate-500 max-w-sm">
        Modul evaluasi hafalan komprehensif sedang dalam tahap pengembangan.
      </p>
    </div>
  )
}

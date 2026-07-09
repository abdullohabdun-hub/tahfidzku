import { createFileRoute } from '@tanstack/react-router'
import { User, LogOut } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { logout } from '../../server-fns/auth'

export const Route = createFileRoute('/ustadz/profil')({
  component: ProfilPage,
})

function ProfilPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.invalidate()
    router.navigate({ to: '/' })
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="flex flex-col items-center justify-center text-center mt-8">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-3xl mb-4 border-4 border-white shadow-sm">
          UA
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Ustadz Ahmad</h2>
        <p className="text-slate-500">Pengampu Halaqoh Utsman</p>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span>Keluar Aplikasi</span>
          </div>
        </button>
      </div>
    </div>
  )
}

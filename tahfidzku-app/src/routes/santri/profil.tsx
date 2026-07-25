import { createFileRoute, useRouter, redirect, isRedirect } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { checkAuth, logout } from '../../server-fns/auth'
import { ChangePasswordForm } from '../../components/ChangePasswordForm'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'

export const Route = createFileRoute('/santri/profil')({
  component: ProfilPage,
  loader: async () => {
    try {
      const res = await checkAuth()
      if (!res.success) {
        if (res.error?.code === 'UNAUTHENTICATED') throw redirect({ to: '/login' })
        return { user: null, authError: { message: res.error?.message, code: res.error?.code } }
      }
      return { user: res.data, authError: null }
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return { user: null, authError: { message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' } }
    }
  }
})

function ProfilPage() {
  const router = useRouter()
  const { user, authError } = Route.useLoaderData()

  if (authError) return <AuthErrorAlert error={authError} />
  if (!user) return null

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      router.invalidate()
      router.navigate({ to: '/login' })
    }
  }

  const initial = user?.nama ? user.nama.substring(0, 2).toUpperCase() : "SA"
  const nama = user?.nama || "Santri"

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="flex flex-col items-center justify-center text-center mt-8">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-3xl mb-4 border-4 border-white shadow-sm">
          {initial}
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{nama}</h2>
        <p className="text-slate-500">Santri Reguler</p>
      </div>

        <ChangePasswordForm role="santri" />

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


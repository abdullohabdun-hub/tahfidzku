import { createFileRoute, useRouter, redirect, isRedirect } from '@tanstack/react-router'
import { LogOut, Shield } from 'lucide-react'
import { checkAuth, logout } from '../../server-fns/auth'
import { ChangePasswordForm } from '../../components/ChangePasswordForm'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'
import { SantriProfileView } from '../../components/shared/SantriProfileView'

export const Route = createFileRoute('/santri/profil')({
  component: ProfilPage,
  loader: async () => {
    try {
      const user = await checkAuth()
      if (!user) throw redirect({ to: '/login' })
      const targetId = user.santriId ?? null
      return { user, targetId, authError: null }
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return { user: null, targetId: null, authError: { message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' } }
    }
  }
})

function ProfilPage() {
  const router = useRouter()
  const { user, targetId, authError } = Route.useLoaderData()

  if (authError) return <AuthErrorAlert error={authError} />
  if (!user || !targetId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Data profil santri tidak terhubung dengan akun ini.
      </div>
    )
  }

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Shared Santri Profile & Indeks View */}
      <SantriProfileView 
        santriId={targetId} 
        titlePrefix="Profil Saya" 
        showLogoutButton 
        onLogout={handleLogout} 
      />

      {/* Ubah Password Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          Keamanan Akun
        </h3>
        <ChangePasswordForm role="santri" />
      </div>

      {/* Tombol Logout Bottom */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 max-w-4xl mx-auto">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors font-bold text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Aplikasi</span>
        </button>
      </div>
    </div>
  )
}

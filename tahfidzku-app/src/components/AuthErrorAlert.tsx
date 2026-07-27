import { Link, useRouter } from '@tanstack/react-router'
import { ShieldAlert, ArrowLeft, WifiOff } from 'lucide-react'

export function AuthErrorAlert({ error }: { error: { message: string; code?: string } }) {
  const router = useRouter()
  
  // Deteksi role dari URL saat ini untuk tombol "Kembali"
  const currentPath = router.state.location.pathname
  let backLink = '/'
  if (currentPath.startsWith('/ustadz')) backLink = '/ustadz'
  else if (currentPath.startsWith('/santri')) backLink = '/santri'
  else if (currentPath.startsWith('/wali')) backLink = '/wali'
  else if (currentPath.startsWith('/admin')) backLink = '/admin'
  else if (currentPath.startsWith('/superadmin')) backLink = '/superadmin'

  const isNetworkError = error?.code === 'NETWORK_ERROR'

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] p-4 text-center">
      <div className={`w-16 h-16 flex items-center justify-center rounded-full mb-4 ${isNetworkError ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
        {isNetworkError ? <WifiOff className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
      </div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">
        {isNetworkError ? 'Gagal Terhubung' : 'Akses Ditolak'}
      </h2>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        {error?.message || 'Anda tidak memiliki akses ke fitur ini atau terjadi kesalahan jaringan.'}
      </p>
      <Link 
        to={backLink} 
        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Beranda
      </Link>
    </div>
  )
}

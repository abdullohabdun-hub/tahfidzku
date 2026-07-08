import { createFileRoute, redirect } from '@tanstack/react-router'
import { checkAuth } from '../server-fns/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await checkAuth()
    
    if (!user) {
      throw redirect({ to: '/login' })
    }

    switch (user.role) {
      case 'admin':
        throw redirect({ to: '/admin' })
      case 'ustadz':
        throw redirect({ to: '/ustadz' })
      case 'wali':
        throw redirect({ to: '/wali' })
      case 'santri':
        throw redirect({ to: '/santri' })
      default:
        throw redirect({ to: '/login' })
    }
  },
  component: Loading,
})

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Memuat ruang kerja Anda...</p>
      </div>
    </div>
  )
}

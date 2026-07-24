import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { inputMurojaah } from '../../server-fns/setoran'
import { getSantriProfile } from '../../server-fns/santri'
import { SetoranForm } from '../../components/SetoranForm'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'

export const Route = createFileRoute('/santri/input')({
  component: SantriInputMurojaah,
})

function SantriInputMurojaah() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<{ message: string, code?: string } | null>(null)
  
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function init() {
      try {
        const res = await getSantriProfile()
        if (!res.success) {
          if (res.error?.code === 'UNAUTHENTICATED') {
            navigate({ to: '/login' })
            return
          }
          setAuthError({ message: res.error?.message || 'Akses ditolak', code: res.error?.code })
          return
        }
        if (res.data) {
          setProfile(res.data)
        }
      } catch (err: any) {
        setAuthError({ message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' })
      } finally {
        setLoadingInitial(false)
      }
    }
    init()
  }, [])

  const handleSubmit = async (payload: any) => {
    return await inputMurojaah({ data: payload })
  }

  if (authError) {
    return <AuthErrorAlert error={authError} />
  }

  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }



  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8 relative">
      <div className="flex items-center gap-3 sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-20">
        <button 
          onClick={() => navigate({ to: '/santri' })}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Lapor Murojaah</h1>
          <p className="text-[11px] text-slate-500 font-medium">Input mandiri hafalan lama</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative z-10">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Setor Sebagai</label>
        <p className="text-sm font-bold text-slate-800">{profile?.nama} ({profile?.kelas?.nama})</p>
      </div>

      <SetoranForm
        mode="create"
        defaultJenis="sabqi"
        isUstadz={false}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

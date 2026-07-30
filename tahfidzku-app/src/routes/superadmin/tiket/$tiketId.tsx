import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { getTiketDetailFn } from '../../../server-fns/tiket'
import { checkAuth } from '../../../server-fns/auth'
import { TiketDetail } from '../../../components/tiket/TiketDetail'

export const Route = createFileRoute('/superadmin/tiket/$tiketId')({
  component: SuperadminTiketDetail,
})

function SuperadminTiketDetail() {
  const router = useRouter()
  const { tiketId } = Route.useParams()
  const getDetail = useServerFn(getTiketDetailFn)
  
  const [data, setData] = useState<{ tiket: any; balasan: any[] } | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const u = await checkAuth()
        setUser(u)
        
        const res = await getDetail({ data: { id: tiketId } })
        if (res.success && res.data) {
          setData(res.data)
        } else {
          setError((res as any).error?.message || 'Gagal memuat tiket')
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tiketId])

  if (loading || !user) return <div className="p-4 flex justify-center"><span className="animate-pulse">Memuat...</span></div>
  if (error) return <div className="p-4 text-center text-rose-500">{error}</div>
  if (!data) return null

  return (
    <div className="max-w-4xl mx-auto">
      <TiketDetail 
        tiket={data.tiket} 
        balasan={data.balasan} 
        userRole={user.isSuperAdmin ? 'superadmin' : user.role}
        userId={user.id}
        tenantId={user.tenantId}
        onBack={() => router.navigate({ to: '/superadmin/tiket' })}
      />
    </div>
  )
}

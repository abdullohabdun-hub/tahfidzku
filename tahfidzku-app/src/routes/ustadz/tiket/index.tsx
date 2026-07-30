import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { getTiketListFn } from '../../../server-fns/tiket'
import { checkAuth } from '../../../server-fns/auth'
import { TiketList } from '../../../components/tiket/TiketList'

export const Route = createFileRoute('/ustadz/tiket/')({
  component: UstadzTiketIndex,
})

function UstadzTiketIndex() {
  const router = useRouter()
  const getList = useServerFn(getTiketListFn)
  const [tiket, setTiket] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const u = await checkAuth()
        setUser(u)
        
        const res = await getList({ data: {} })
        if (res.success && res.data) {
          setTiket(res.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !user) return <div className="p-4 flex justify-center"><span className="animate-pulse">Memuat...</span></div>

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Tiket Bantuan</h2>
        <p className="text-slate-500 text-sm">Kelola pengaduan dan pertanyaan</p>
      </div>
      <TiketList 
        tiket={tiket}
        userRole={user.isSuperAdmin ? 'superadmin' : user.role}
        userId={user.id}
        baseUrl="/ustadz/tiket"
        onNewTicketClick={() => router.navigate({ to: '/ustadz/tiket/buat' })}
      />
    </div>
  )
}

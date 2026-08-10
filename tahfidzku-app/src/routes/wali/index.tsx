import { createFileRoute, isRedirect } from '@tanstack/react-router'
import { getWaliBeranda } from '../../server-fns/wali-beranda'
import { MotivationCard } from '../../components/shared/MotivationCard'
import { BerandaHighlightCarousel } from '../../components/dashboard/BerandaHighlightCarousel'
import { PengumumanWaliList } from '../../components/dashboard/PengumumanWaliList'
import { formatDateWithHijri } from '../../lib/hijri-date'

export const Route = createFileRoute('/wali/')({
  component: WaliBeranda,
  loader: async () => {
    try {
      const res = await getWaliBeranda()
      if (!res.success) {
        throw new Error(res.error?.message || 'Gagal memuat data beranda')
      }
      return res.data
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return null
    }
  }
})

function WaliBeranda() {
  const data = Route.useLoaderData()

  if (!data) return null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6 pt-4 pb-24">
        
        <div className="px-4 space-y-6">
          {/* Motivation & Hikmah Card */}
          <MotivationCard />

          {/* Highlight Anak */}
          <BerandaHighlightCarousel anakList={data.daftarAnak} />

          {/* Papan Pengumuman */}
          <PengumumanWaliList pengumumanList={data.pengumuman} />
        </div>
        
      </div>
    </div>
  )
}

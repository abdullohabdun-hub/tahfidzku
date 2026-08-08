import { createFileRoute } from '@tanstack/react-router'
import { getWaliBeranda } from '../../server-fns/wali-beranda'
import { DailyQuoteCard } from '../../components/dashboard/DailyQuoteCard'
import { BerandaHighlightCarousel } from '../../components/dashboard/BerandaHighlightCarousel'
import { PengumumanWaliList } from '../../components/dashboard/PengumumanWaliList'

export const Route = createFileRoute('/wali/')({
  component: WaliBeranda,
  loader: async () => {
    try {
      const res = await getWaliBeranda()
      if (!res.success) {
        throw new Error(res.error?.message || 'Gagal memuat data beranda')
      }
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  staleTime: 5 * 60 * 1000, // Cache selama 5 menit
  gcTime: 10 * 60 * 1000, // Simpan di memori selama 10 menit
  errorComponent: ({ error }) => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 mb-4">{error.message}</p>
      </div>
    )
  }
})

function WaliBeranda() {
  const data = Route.useLoaderData()

  if (!data) return null

  // Hijriah date logic placeholder - in a real app this might use a library
  const today = new Date()
  const masehiDate = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  
  const hijriahDate = new Intl.DateTimeFormat('id-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6 pb-24">
        
        {/* Header Beranda */}
        <div className="px-4 pt-4 pb-2 flex justify-between items-end">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Assalamu'alaikum,<br />Bapak/Ibu {data.namaWali}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-emerald-600">{hijriahDate}</p>
            <p className="text-[10px] text-slate-500">{masehiDate}</p>
          </div>
        </div>
        
        <div className="px-4 space-y-6">
          {/* Daily Quote */}
          <DailyQuoteCard quote={data.dailyQuote} />

          {/* Highlight Anak */}
          <BerandaHighlightCarousel anakList={data.daftarAnak} />

          {/* Papan Pengumuman */}
          <PengumumanWaliList pengumumanList={data.pengumuman} />
        </div>
        
      </div>
    </div>
  )
}

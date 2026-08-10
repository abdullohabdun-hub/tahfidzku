import { createFileRoute, isRedirect } from '@tanstack/react-router'
import { getWaliBeranda } from '../../server-fns/wali-beranda'
import { DailyQuoteCard } from '../../components/dashboard/DailyQuoteCard'
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

  const today = new Date()
  const formattedFullDate = formatDateWithHijri(today, { includeWeekday: true })

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
            <p className="text-xs font-semibold text-emerald-700">{formattedFullDate}</p>
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

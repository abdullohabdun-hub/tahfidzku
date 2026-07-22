import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent } from "../../components/ui/card"
import { Clock } from "lucide-react"
import { getWaliDashboard } from "../../server-fns/dashboard"

export const Route = createFileRoute('/wali/')({
  component: WaliDashboard,
  loader: async () => {
    const res = await getWaliDashboard()
    if (!res.success || !res.data) {
      throw new Error('Gagal memuat data')
    }
    return res.data
  }
})

function WaliDashboard() {
  const { daftarAnak } = Route.useLoaderData()
  const [activeIndex, setActiveIndex] = useState(0)

  // Pastikan data valid
  if (!daftarAnak || daftarAnak.length === 0) {
    return <div className="p-4 text-center">Data anak tidak ditemukan</div>
  }

  const activeData = daftarAnak[activeIndex]
  if (!activeData) return null

  const totalJuz = activeData.progress.targetJuz || 30
  const juzSelesai = activeData.progress.juzSelesai || 0
  const percentage = activeData.progress.percentage || 0

  // SVG Circle calculation
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const riwayat = activeData.riwayat || []

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const profil = activeData.profil

  const getInisial = (nama: string) => {
    if (!nama) return '?'
    const parts = nama.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-6">

      {/* Tab Switcher Anak (Jika lebih dari 1) */}
      {daftarAnak.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {daftarAnak.map((anak: any, idx: number) => (
            <button
              key={anak.profil.id}
              onClick={() => setActiveIndex(idx)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                idx === activeIndex 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {anak.profil.nama.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Date & Profil Anak */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-lg border-2 border-white shadow-sm">
              {getInisial(profil.nama)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">{profil.nama}</h2>
              <p className="text-sm text-slate-500">{profil.namaKelas || 'Belum ada kelas'}</p>
            </div>
          </div>
          <p className="text-emerald-700 text-[11px] font-bold pb-1">{today}</p>
        </div>

        {/* Motivation Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 text-white shadow-md">
          <p className="text-emerald-50 text-xs italic text-center">"Siapa yang membaca Al-Qur'an dan mengamalkan isinya, maka Allah akan memakaikan mahkota kepada kedua orang tuanya pada hari kiamat..." (HR. Abu Daud)</p>
        </div>
      </div>

      {/* Progress Card (Grafik Lingkaran) */}
      <Card className="border-slate-100 shadow-sm overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">

            {/* SVG Circular Progress */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Background Circle */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-100"
                />
                {/* Progress Circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Text Inside Circle */}
              <div className="text-center absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{percentage}%</span>
                <span className="text-xs text-slate-500 font-medium">Selesai</span>
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="text-slate-600 text-sm">Total Hafalan Saat Ini:</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">{juzSelesai} Juz</p>
              <p className="text-xs text-slate-400 mt-1">Target pencapaian: {totalJuz} Juz</p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Statistik Cepat */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-500 mb-1">Setoran Terakhir</p>
          <p className="text-sm font-bold text-slate-800 capitalize">{riwayat.length > 0 ? riwayat[0].surah || '-' : '-'}</p>
          <p className="text-xs text-slate-400">-</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-500 mb-1">Kelancaran Terakhir</p>
          <p className="text-sm font-bold text-emerald-600 capitalize">{riwayat.length > 0 ? (riwayat[0].kualitas === 'mengulang' || riwayat[0].kualitas === 'terbata' ? 'Mengulang' : 'Baik') : '-'}</p>
          <p className="text-xs text-slate-400">{riwayat.length > 0 ? riwayat[0].jenis : '-'}</p>
        </div>
      </div>

      {/* Lini Masa (Timeline) Riwayat */}
      <section className="pt-2">
        <h3 className="text-base font-bold text-slate-800 mb-4">Riwayat Setoran</h3>

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-[2px] before:bg-slate-200">

          {riwayat.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-4">Belum ada riwayat setoran.</div>
          ) : (
            riwayat.map((item: any) => {
              const date = new Date(item.createdAt)
              const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

              let kualitasLabel = 'Baik'
              let kualitasColor = 'text-emerald-600 bg-emerald-100 border-emerald-200'
              
              if (item.kualitas === 'mengulang' || item.kualitas === 'terbata') {
                kualitasLabel = item.kualitas === 'mengulang' ? 'Mengulang' : 'Terbata'
                kualitasColor = 'text-amber-700 bg-amber-100 border-amber-200'
              }

              return (
                <div key={item.id} className="relative flex items-start group">
                  {/* Icon / Bullet */}
                  <div className="flex flex-col items-center mt-1 w-8 shrink-0 relative z-10">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50" />
                  </div>

                  {/* Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex-1 ml-3">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {dateStr}, {timeStr}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${kualitasColor}`}>
                        {kualitasLabel}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-0.5 capitalize">{item.jenis}: {item.surah || 'Surah'}</h4>
                    <p className="text-slate-500 text-[11px]">Dinilai oleh: {item.ustadzNama}</p>
                  </div>
                </div>
              )
            })
          )}

        </div>
        <button className="w-full mt-6 py-3 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
          Lihat Semua Riwayat
        </button>
      </section>

    </div>
  )
}

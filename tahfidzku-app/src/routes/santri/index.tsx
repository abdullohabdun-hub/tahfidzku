import { createFileRoute } from "@tanstack/react-router"
import { CheckCircle2, Clock, Edit } from "lucide-react"

export const Route = createFileRoute('/santri/')({
  component: SantriDashboard,
})

function SantriDashboard() {
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  
  const riwayat = [
    {
      id: 1,
      tanggal: "Hari ini, 06:00",
      jenis: "Ziyadah",
      surah: "Al-Mulk (1-10)",
      kualitas: "Lancar",
      kualitasColor: "text-emerald-600 bg-emerald-100 border-emerald-200",
    },
    {
      id: 2,
      tanggal: "Kemarin, 16:30",
      jenis: "Murojaah",
      surah: "Al-Qalam (1-52)",
      kualitas: "Lancar",
      kualitasColor: "text-emerald-600 bg-emerald-100 border-emerald-200",
    },
    {
      id: 3,
      tanggal: "5 Juli 2026",
      jenis: "Sabqi",
      surah: "Al-Haqqah (1-15)",
      kualitas: "Mengulang",
      kualitasColor: "text-amber-700 bg-amber-100 border-amber-200",
    },
  ]

  return (
    <div className="p-5 space-y-8 max-w-lg mx-auto pb-8">
      
      {/* Date & Motivation Card */}
      <div className="space-y-4">
        <p className="text-emerald-700 text-sm font-bold px-2">{today}</p>
        
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md">
          <p className="text-emerald-50 text-sm italic">"Barangsiapa membaca satu huruf dari Kitabullah (Al-Qur'an), maka baginya satu kebaikan..." (HR. Tirmidzi)</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-slate-100 shadow-sm flex items-start gap-4">
          <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 mt-1">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Alhamdulillah!</h2>
            <p className="text-slate-600 mt-1">Anda sudah melapor <strong className="text-emerald-600">3 kali</strong> minggu ini. Terus tingkatkan semangat murojaahnya!</p>
          </div>
        </div>
      </div>

      {/* Riwayat Timeline */}
      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-5">Riwayat Laporan Anda</h3>
        
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          
          {riwayat.map((item) => (
            <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Icon / Bullet */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Clock className="w-4 h-4" />
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm ml-4 md:ml-0 relative">
                <button className="absolute bottom-4 right-4 text-slate-400 hover:text-emerald-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <div className="flex justify-between items-start mb-2 pr-6">
                  <span className="text-xs font-bold text-slate-400">{item.tanggal}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${item.kualitasColor}`}>
                    {item.kualitas}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-base">{item.jenis}</h4>
                <p className="text-slate-600 text-sm mt-1">{item.surah}</p>
              </div>
            </div>
          ))}

        </div>
      </section>
      
    </div>
  )
}

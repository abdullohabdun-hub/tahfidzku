import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"

export default function InputLaporan() {
  const [jenisSetoran, setJenisSetoran] = useState("Ziyadah")
  const [kualitas, setKualitas] = useState<string | null>(null)

  const jenisOptions = ["Ziyadah", "Sabqi", "Manzil"]
  
  return (
    <div className="p-5 space-y-8 max-w-lg mx-auto pb-8">
      
      {/* 1. Jenis Setoran */}
      <section className="space-y-3">
        <label className="text-base font-bold text-slate-800">1. Apa yang Anda setorkan hari ini?</label>
        <div className="grid grid-cols-2 gap-3">
          {jenisOptions.map((jenis) => (
            <button
              key={jenis}
              type="button"
              onClick={() => setJenisSetoran(jenis)}
              className={`py-4 px-4 rounded-xl font-bold text-lg transition-all ${
                jenisSetoran === jenis 
                  ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-600 ring-offset-2" 
                  : "bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {jenis}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Surah & Ayat */}
      <section className="space-y-4 p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-800">Surah</label>
          <div className="relative">
            <select className="w-full appearance-none bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold text-lg rounded-xl px-4 py-4 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>Al-Mulk</option>
              <option>Al-Qalam</option>
              <option>Al-Haqqah</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <ChevronDown className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800">Dari Ayat</label>
            <input 
              type="number" 
              inputMode="numeric"
              placeholder="1"
              className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold text-lg rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800">Sampai Ayat</label>
            <input 
              type="number" 
              inputMode="numeric"
              placeholder="10"
              className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold text-lg rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* 3. Kualitas Bacaan */}
      <section className="space-y-3">
        <label className="text-base font-bold text-slate-800">2. Bagaimana kelancaran bacaan Anda?</label>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setKualitas("Lancar")}
            className={`flex items-center justify-between py-5 px-5 rounded-xl font-bold text-lg border-2 transition-all ${
              kualitas === "Lancar" 
                ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span>🟢 Lancar</span>
            {kualitas === "Lancar" && <Check className="w-6 h-6 text-emerald-600" />}
          </button>
          
          <button
            type="button"
            onClick={() => setKualitas("Mengulang")}
            className={`flex items-center justify-between py-5 px-5 rounded-xl font-bold text-lg border-2 transition-all ${
              kualitas === "Mengulang" 
                ? "border-amber-500 bg-amber-50 text-amber-700" 
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span>🟡 Masih Mengulang</span>
            {kualitas === "Mengulang" && <Check className="w-6 h-6 text-amber-600" />}
          </button>

          <button
            type="button"
            onClick={() => setKualitas("Terbata-bata")}
            className={`flex items-center justify-between py-5 px-5 rounded-xl font-bold text-lg border-2 transition-all ${
              kualitas === "Terbata-bata" 
                ? "border-red-500 bg-red-50 text-red-700" 
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span>🔴 Terbata-bata</span>
            {kualitas === "Terbata-bata" && <Check className="w-6 h-6 text-red-600" />}
          </button>
        </div>
      </section>

      {/* 4. Catatan */}
      <section className="space-y-3 pb-8">
        <label className="text-base font-bold text-slate-800">3. Catatan (Opsional)</label>
        <textarea 
          rows={3}
          placeholder="Ada catatan untuk Ustadz?"
          className="w-full bg-white border-2 border-slate-200 text-slate-900 rounded-xl px-4 py-4 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        ></textarea>
      </section>

      {/* 5. Tombol Kirim */}
      <div className="sticky bottom-[80px] pt-4 pb-2 z-40 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl py-5 rounded-2xl shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition-transform">
          Kirim Laporan
        </button>
      </div>

    </div>
  )
}

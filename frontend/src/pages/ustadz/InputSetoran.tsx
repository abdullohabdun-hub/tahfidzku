import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"

export default function InputSetoran() {
  const [santri, setSantri] = useState("Ahmad Fulan")
  const [jenisSetoran, setJenisSetoran] = useState("Ziyadah")
  const [kualitas, setKualitas] = useState<string | null>(null)

  const jenisOptions = ["Ziyadah", "Sabqi", "Manzil"]
  
  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      
      {/* 1. Pemilihan Santri */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Pilih Santri</label>
        <div className="relative">
          <select 
            className="w-full appearance-none bg-white border border-slate-200 text-slate-900 font-medium text-lg rounded-xl px-4 py-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={santri}
            onChange={(e) => setSantri(e.target.value)}
          >
            <option value="Ahmad Fulan">Ahmad Fulan</option>
            <option value="Budi Santoso">Budi Santoso</option>
            <option value="Zaid Abdullah">Zaid Abdullah</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* 2. Jenis Setoran */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Jenis Setoran</label>
        <div className="grid grid-cols-2 gap-3">
          {jenisOptions.map((jenis) => (
            <button
              key={jenis}
              type="button"
              onClick={() => setJenisSetoran(jenis)}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                jenisSetoran === jenis 
                  ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 ring-offset-1" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {jenis}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Surah & Ayat */}
      <section className="space-y-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Surah</label>
          <div className="relative">
            <select className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>Al-Mulk</option>
              <option>Al-Qalam</option>
              <option>Al-Haqqah</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dari Ayat</label>
            <input 
              type="number" 
              inputMode="numeric"
              placeholder="1"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sampai Ayat</label>
            <input 
              type="number" 
              inputMode="numeric"
              placeholder="10"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* 4. Kualitas Bacaan */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Kualitas Bacaan</label>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setKualitas("Lancar")}
            className={`flex items-center justify-between py-4 px-5 rounded-xl font-medium border-2 transition-all ${
              kualitas === "Lancar" 
                ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span>🟢 Lancar (Mumtaz)</span>
            {kualitas === "Lancar" && <Check className="w-5 h-5 text-emerald-600" />}
          </button>
          
          <button
            type="button"
            onClick={() => setKualitas("Mengulang")}
            className={`flex items-center justify-between py-4 px-5 rounded-xl font-medium border-2 transition-all ${
              kualitas === "Mengulang" 
                ? "border-amber-500 bg-amber-50 text-amber-700" 
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span>🟡 Mengulang (Jayyid)</span>
            {kualitas === "Mengulang" && <Check className="w-5 h-5 text-amber-600" />}
          </button>

          <button
            type="button"
            onClick={() => setKualitas("Terbata-bata")}
            className={`flex items-center justify-between py-4 px-5 rounded-xl font-medium border-2 transition-all ${
              kualitas === "Terbata-bata" 
                ? "border-red-500 bg-red-50 text-red-700" 
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span>🔴 Terbata-bata (Maqbul)</span>
            {kualitas === "Terbata-bata" && <Check className="w-5 h-5 text-red-600" />}
          </button>
        </div>
      </section>

      {/* 5. Catatan */}
      <section className="space-y-2 pb-6">
        <label className="text-sm font-semibold text-slate-700">Catatan Tajwid/Makhraj (Opsional)</label>
        <textarea 
          rows={3}
          placeholder="Tuliskan jika ada koreksi tajwid..."
          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        ></textarea>
      </section>

      {/* 6. Tombol Simpan */}
      <div className="sticky bottom-[80px] pt-4 pb-2 z-40 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-transform">
          Simpan Setoran
        </button>
      </div>

    </div>
  )
}

import { createFileRoute, Link, redirect, isRedirect } from "@tanstack/react-router"
import { useState } from "react"
import { Edit, Clock, Award, PlusCircle, BarChart3, ChevronLeft, ChevronRight, Activity, Users, BookOpen, Quote, CalendarCheck, UserX } from "lucide-react"
import { getUstadzDashboard, getAgregatSantriDashboard } from "../../server-fns/dashboard"
import { getAllRubrikTenant } from "../../server-fns/rubrik"
import { FormatPenilaian } from "../../components/FormatPenilaian"
import { AuthErrorAlert } from "../../components/AuthErrorAlert"
import { StatCard } from "../../components/shared/StatCard"

export const Route = createFileRoute('/ustadz/')({
  component: UstadzDashboard,
  loader: async () => {
    try {
      const res = await getUstadzDashboard()
      const agregatRes = await getAgregatSantriDashboard()
      if (!res.success) {
        if (res.error?.code === 'UNAUTHENTICATED') throw redirect({ to: '/login' })
        return { data: null, agregat: null, rubrikAktif: null, authError: { message: res.error?.message, code: res.error?.code } }
      }
      const rubrikRes = await getAllRubrikTenant()
      return { 
        data: res.data, 
        agregat: agregatRes.success ? agregatRes.data : null,
        rubrikAktif: Array.isArray(rubrikRes) ? rubrikRes.filter((r: any) => r.aktif) : []
      }
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return { data: null, agregat: null, rubrikAktif: null, authError: { message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' } }
    }
  }
})

// Pool Kutipan Motivasi dengan 100% TEMPORARY PLACEHOLDER (Teks & Sitasi) sampai verifikasi independen selesai
const MOTIVASI_POOL = [
  { text: "Kutipan Motivasi Islami #1 (Placeholder)", ref: "Sumber Rujukan #1 (Placeholder)" },
  { text: "Kutipan Motivasi Islami #2 (Placeholder)", ref: "Sumber Rujukan #2 (Placeholder)" },
  { text: "Kutipan Motivasi Islami #3 (Placeholder)", ref: "Sumber Rujukan #3 (Placeholder)" },
  { text: "Kutipan Motivasi Islami #4 (Placeholder)", ref: "Sumber Rujukan #4 (Placeholder)" },
  { text: "Kutipan Motivasi Islami #5 (Placeholder)", ref: "Sumber Rujukan #5 (Placeholder)" },
  { text: "Kutipan Motivasi Islami #6 (Placeholder)", ref: "Sumber Rujukan #6 (Placeholder)" }
]

function UstadzDashboard() {
  const { data, agregat, authError } = Route.useLoaderData()
  const [currentSlide, setCurrentSlide] = useState(0)
  
  if (authError) return <AuthErrorAlert error={authError} />
  if (!data) return null

  const persentase = data.totalSantri > 0 ? Math.round((data.totalSetoran / data.totalSantri) * 100) : 0

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % MOTIVASI_POOL.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + MOTIVASI_POOL.length) % MOTIVASI_POOL.length)
  }

  const activeMotivasi = MOTIVASI_POOL[currentSlide]

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-32 font-sans">
      
      {/* 1. SEKSI 1: RINGKASAN HARI INI (Memakai Komponen Shared StatCard) */}
      <section className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Ringkasan Hari Ini</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Santri Setor Hari Ini"
            value={`${data.totalSetoran}/${data.totalSantri}`}
            icon={Users}
            tone="neutral"
            className="p-4"
          />
          <StatCard
            label="Target Selesai"
            value={`${persentase}%`}
            icon={Activity}
            tone="neutral"
            className="p-4"
          />
          {agregat && (
            <>
              <StatCard
                label="Kehadiran 7 Hari"
                value={`${agregat.rataKehadiranPersen}%`}
                icon={CalendarCheck}
                tone="neutral"
                className="p-4"
              />
              <StatCard
                label="Tanpa Setor (7 Hari)"
                value={`${agregat.santriTanpaSetoran} santri`}
                icon={UserX}
                tone={agregat.santriTanpaSetoran > 0 ? "warning" : "neutral"}
                className="p-4"
              />
            </>
          )}
        </div>
      </section>

      {/* 2. SEKSI 2: KARTU MOTIVASI ISLAMI (Carousel Banner) */}
      <section className="relative bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-md overflow-hidden">
        <div className="absolute right-2 top-2 opacity-10 pointer-events-none">
          <Quote className="w-24 h-24 text-white" />
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" /> Motivasi & Hikmah
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-200/80 font-medium">{currentSlide + 1} / {MOTIVASI_POOL.length}</span>
            <div className="flex gap-1">
              <button 
                onClick={prevSlide}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={nextSlide}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-[64px] flex flex-col justify-center my-1">
          <p className="text-sm md:text-base font-medium text-emerald-50 italic leading-relaxed">
            "{activeMotivasi.text}"
          </p>
          <p className="text-xs text-emerald-300/90 font-semibold mt-2 text-right">
            — {activeMotivasi.ref}
          </p>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-1.5 mt-3 pt-2 border-t border-white/10">
          {MOTIVASI_POOL.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      </section>

      {/* 3. SEKSI 3: MENU CEPAT (Quick Menu Grid) */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Menu Cepat</h3>
        <div className="grid grid-cols-4 gap-2.5">
          <Link
            to="/ustadz/pantau"
            className="flex flex-col items-center justify-center bg-white border border-slate-200/70 p-3 rounded-xl shadow-xs hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 group text-center"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-800 leading-tight">Pantau Murojaah</span>
          </Link>

          <Link
            to="/ustadz/ujian"
            className="flex flex-col items-center justify-center bg-white border border-slate-200/70 p-3 rounded-xl shadow-xs hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 group text-center"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-800 leading-tight">Ujian Santri</span>
          </Link>

          <Link
            to="/ustadz/input"
            className="flex flex-col items-center justify-center bg-white border border-slate-200/70 p-3 rounded-xl shadow-xs hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 group text-center"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-800 leading-tight">Input Setoran</span>
          </Link>

          <Link
            to="/ustadz/analitik"
            className="flex flex-col items-center justify-center bg-white border border-slate-200/70 p-3 rounded-xl shadow-xs hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 group text-center"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-800 leading-tight">Analitik Detail</span>
          </Link>
        </div>
      </section>

      {/* 4. BELUM SETOR HARI INI */}
      <section className="pt-1">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Belum Setor Hari Ini</h3>
          <Link to="/ustadz/pantau" className="text-emerald-700 text-xs font-bold hover:underline">Lihat Semua</Link>
        </div>
        <div className="space-y-2.5">
          {data.belumSetor.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">Semua santri sudah setor hari ini 🎉</p>
          ) : data.belumSetor.slice(0, 4).map((santri) => {
            const isIqra = santri.displayMode === 'iqra'
            const targetLabel = isIqra ? `Iqra Jilid ${santri.jilidIqraTerakhir || 1}` : `Target: Juz ${santri.targetJuz}`
            return (
              <div key={santri.id} className="group bg-white border border-slate-200/80 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold border uppercase text-xs ${isIqra ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    {santri.nama.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{santri.nama}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{targetLabel}</p>
                  </div>
                </div>
                <Link 
                  to="/ustadz/input"
                  className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-100 transition-colors border border-emerald-200/60"
                >
                  Input
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. SETORAN TERBARU */}
      <section className="pt-1">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Setoran Terbaru</h3>
        </div>
        <div className="space-y-2.5">
          {data.setoranTerbaru.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">Belum ada setoran masuk</p>
          ) : data.setoranTerbaru.slice(0, 3).map((s) => {
            const isIqra = s.tipe === 'iqra'
            return (
              <div key={s.id} className="group bg-white border border-slate-200/80 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold border uppercase text-xs ${isIqra ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {s.santriNama?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{s.santriNama}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 mt-0.5">
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${isIqra ? 'text-violet-700 bg-violet-50' : 'text-emerald-700 bg-emerald-50'}`}>
                        {isIqra ? 'Iqra' : (s as any).jenis}
                      </span>
                      <span>•</span>
                      <span>{isIqra ? `Jilid ${(s as any).jilid}` : (s as any).surah} ({isIqra ? 'Hal ' : ''}{isIqra && (s as any).halamanAwal === (s as any).halamanAkhir ? (s as any).halamanAwal : `${(s as any).halamanAwal ?? (s as any).ayatAwal}-${(s as any).halamanAkhir ?? (s as any).ayatAkhir}`})</span>
                    </div>
                    <FormatPenilaian item={s} />
                  </div>
                </div>
                <Link to="/ustadz/riwayat" className="flex items-center justify-center gap-1 bg-white text-slate-600 border border-slate-200 shadow-xs font-semibold px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-50 hover:text-emerald-700 transition-colors">
                  <Edit className="w-3 h-3" /> Edit
                </Link>
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}

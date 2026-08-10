import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { motivasiHikmahList, type MotivasiHikmah } from "../../config/motivasi-hikmah.config"

export function MotivationCard() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const totalSlides = motivasiHikmahList.length
  const activeMotivasi: MotivasiHikmah = motivasiHikmahList[currentSlide]

  // Function to reset timer when manually navigated
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 20000) // 20 detik auto-slide
  }

  useEffect(() => {
    if (!isPaused) {
      startTimer()
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, totalSlides])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
    if (!isPaused) startTimer()
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
    if (!isPaused) startTimer()
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    if (!isPaused) startTimer()
  }

  // Format sumber: "— QS. Al-Qamar: 17" atau "— HR. Bukhari, no. 5027 (shahih)"
  const formatSumber = (item: MotivasiHikmah) => {
    if (item.jenis === "hadits" && item.derajat) {
      return `— ${item.sumber} (${item.derajat})`
    }
    return `— ${item.sumber}`
  }

  return (
    <section 
      className="relative bg-gradient-to-br from-emerald-900 to-emerald-950 border border-emerald-800/80 rounded-2xl p-5 text-white shadow-md overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background Icon Decoration */}
      <div className="absolute right-3 top-11 opacity-[0.08] pointer-events-none z-0">
        <Quote className="w-20 h-20 text-white" />
      </div>

      {/* Control Header (No Title Text, only slide counter & navigation buttons) */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] text-emerald-200/80 font-medium tracking-wide">
          {currentSlide + 1} / {totalSlides}
        </div>
        <div className="flex items-center gap-1.5 z-10">
          <button
            onClick={prevSlide}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
            title="Sebelumnya"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextSlide}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
            title="Berikutnya"
            aria-label="Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Body: Teks Arab → Terjemahan → Sumber */}
      <div className="min-h-[110px] flex flex-col justify-center my-1 space-y-3 z-10 relative">
        {/* Teks Arab (Font Noto Naskh Arabic, ~1.4x terjemahan, leading-loose for harakat) */}
        <p 
          dir="rtl" 
          className="font-arabic text-xl sm:text-2xl text-emerald-50 leading-[1.9] text-right font-normal tracking-wide"
        >
          {activeMotivasi.teksArab}
        </p>

        {/* Terjemahan Indonesia */}
        <p className="text-xs sm:text-sm font-medium text-emerald-100/90 leading-relaxed">
          "{activeMotivasi.terjemahan}"
        </p>

        {/* Sumber & Derajat */}
        <p className="text-xs text-emerald-300/90 font-medium italic text-right">
          {formatSumber(activeMotivasi)}
        </p>
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-1.5 mt-3 pt-2.5 border-t border-white/10 z-10 relative">
        {motivasiHikmahList.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentSlide ? "w-5 bg-emerald-400" : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

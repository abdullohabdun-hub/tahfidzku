import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import { CheckCircle2, XCircle, GraduationCap, BookOpen, Clock, AlertCircle } from 'lucide-react'

interface SantriHighlight {
  id: string
  nama: string
  kelas: string | null
  displayMode: 'tahfidz' | 'iqra'
  capaianTerakhir: string | null
  statusAbsensi: string | null
}

interface BerandaHighlightCarouselProps {
  anakList: SantriHighlight[]
}

export function BerandaHighlightCarousel({ anakList }: BerandaHighlightCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const scrollPosition = scrollRef.current.scrollLeft
    const cardWidth = scrollRef.current.offsetWidth * 0.85 // 85% width
    const newIndex = Math.round(scrollPosition / cardWidth)
    setActiveIndex(newIndex)
  }

  if (!anakList || anakList.length === 0) return null

  // Helper untuk badge absensi
  const getAbsensiBadge = (status: string | null) => {
    if (!status) return (
      <div className="flex items-center space-x-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        <span>Belum Hadir</span>
      </div>
    )

    switch (status) {
      case 'hadir':
      case 'hadir_tanpa_setoran':
        return (
          <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Hadir</span>
          </div>
        )
      case 'izin':
        return (
          <div className="flex items-center space-x-1.5 text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Izin</span>
          </div>
        )
      case 'sakit':
        return (
          <div className="flex items-center space-x-1.5 text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Sakit</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-1.5 text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full text-xs font-medium border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
          </div>
        )
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-sm font-bold text-slate-700 mb-3 px-1">Ringkasan Ananda</h2>
      
      {/* Container scroll-snap */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4 space-x-4"
      >
        {anakList.map((anak) => (
          <Card key={anak.id} className="min-w-[85%] max-w-[85%] md:min-w-[300px] md:max-w-[300px] snap-center shrink-0 border-slate-200/60 shadow-sm bg-white">
            <CardContent className="p-4 flex flex-col space-y-4">
              {/* Header: Nama & Absensi */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 truncate max-w-[150px]">{anak.nama}</span>
                  <div className="flex items-center text-xs text-slate-500 mt-0.5 space-x-1">
                    <GraduationCap className="w-3 h-3" />
                    <span className="truncate">{anak.kelas || 'Belum ada kelas'}</span>
                  </div>
                </div>
                {getAbsensiBadge(anak.statusAbsensi)}
              </div>

              {/* Body: Capaian Terakhir */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center space-x-3">
                <div className={`p-2 rounded-md ${anak.displayMode === 'iqra' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {anak.displayMode === 'iqra' ? 'Bacaan Terakhir' : 'Hafalan Terakhir'}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 mt-0.5">
                    {anak.capaianTerakhir || 'Belum ada data'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Indikator Dot */}
      {anakList.length > 1 && (
        <div className="flex justify-center space-x-1.5 mt-2">
          {anakList.map((_, index) => (
            <div 
              key={index} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === index ? 'bg-emerald-500 w-4' : 'bg-slate-300 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

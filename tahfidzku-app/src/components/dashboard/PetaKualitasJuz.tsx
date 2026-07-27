import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { AlertTriangle, WifiOff, Map as MapIcon, Clock } from 'lucide-react'

interface PetaKualitasJuzProps {
  data?: {
    juzNum: number
    skorKualitas: number
    tanggalZiyadahTerakhir: string | null
    tanggalMurojaahTerakhir: string | null
    hariSejakMurojaah: number | null
  }[]
  isLoading?: boolean
  error?: { message: string, code?: string } | null
}

const TOTAL_JUZ = 30

function getSkorColor(skor?: number) {
  switch (skor) {
    case 5: return 'bg-emerald-500 text-white border-emerald-600'
    case 4: return 'bg-emerald-300 text-emerald-900 border-emerald-400'
    case 3: return 'bg-amber-400 text-amber-900 border-amber-500'
    case 2: return 'bg-orange-500 text-white border-orange-600'
    case 1: return 'bg-rose-500 text-white border-rose-600'
    default: return 'bg-slate-100 text-slate-400 border-slate-200'
  }
}

export function PetaKualitasJuz({ data, isLoading, error }: PetaKualitasJuzProps) {
  if (isLoading) {
    return (
      <Card className="w-full h-full animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="h-5 w-40 bg-muted rounded"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mt-4">
            {Array.from({ length: TOTAL_JUZ }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    const isNetworkError = error.code === 'NETWORK_ERROR'
    return (
      <Card className={`w-full h-full ${isNetworkError ? 'border-orange-200 bg-orange-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-2 h-[200px]">
          {isNetworkError ? <WifiOff className="h-8 w-8 text-orange-500" /> : <AlertTriangle className="h-8 w-8 text-rose-500" />}
          <p className={`text-sm font-medium ${isNetworkError ? 'text-orange-600' : 'text-rose-600'}`}>
            {isNetworkError ? 'Gagal Terhubung' : 'Gagal Memuat Peta'}
          </p>
          <p className={`text-xs ${isNetworkError ? 'text-orange-500' : 'text-rose-500'}`}>{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  // Buat map cepat untuk akses O(1) berdasarkan juzNum
  const dataMap = new Map(data.map(d => [d.juzNum, d]))

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <MapIcon className="h-4 w-4" />
          Peta Kualitas Juz
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-2">
          {Array.from({ length: TOTAL_JUZ }).map((_, i) => {
            const juzNum = i + 1
            const juzData = dataMap.get(juzNum)
            const skor = juzData?.skorKualitas
            const colorClass = getSkorColor(skor)
            
            // Cek kondisi freshness (lama tidak murojaah)
            // Syarat: Juz ini sudah disentuh (ada data), tapi belum dimurojaah > 21 hari (atau belum pernah)
            const needsMurojaah = !!juzData && (juzData.hariSejakMurojaah === null || juzData.hariSejakMurojaah > 21)

            return (
              <div 
                key={juzNum} 
                className={`
                  relative flex flex-col items-center justify-center aspect-square rounded-md border
                  text-sm font-semibold transition-all hover:scale-105 cursor-default
                  ${colorClass}
                  ${needsMurojaah ? 'opacity-80 ring-2 ring-rose-400 ring-offset-1' : ''}
                `}
                title={`Juz ${juzNum}${skor ? ` - Skor: ${skor}` : ''}${needsMurojaah ? ' (Perlu Murojaah)' : ''}`}
              >
                {juzNum}
                
                {needsMurojaah && (
                  <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-[1px] shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legenda Ringkas */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" /> Mumtaz
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-300" /> Jayyid Jiddan
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-400" /> Jayyid
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-orange-500" /> Da'if
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-rose-500" /> Da'if Jiddan
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Clock className="w-3.5 h-3.5 text-rose-500" /> &gt; 21 Hari
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { AlertTriangle, WifiOff, Map as MapIcon } from 'lucide-react'

interface DistribusiKualitasJuzProps {
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

export function DistribusiKualitasJuzWali({ data, isLoading, error }: DistribusiKualitasJuzProps) {
  if (isLoading) {
    return (
      <Card className="w-full h-full animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="h-5 w-40 bg-muted rounded"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-12 bg-muted rounded-md mt-4"></div>
          <div className="h-12 bg-muted rounded-md mt-4"></div>
          <div className="h-12 bg-muted rounded-md mt-4"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    const isNetworkError = error.code === 'NETWORK_ERROR'
    return (
      <Card className={`w-full h-full ${isNetworkError ? 'border-orange-200 bg-orange-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-2 h-[150px]">
          {isNetworkError ? <WifiOff className="h-8 w-8 text-orange-500" /> : <AlertTriangle className="h-8 w-8 text-rose-500" />}
          <p className={`text-sm font-medium ${isNetworkError ? 'text-orange-600' : 'text-rose-600'}`}>
            {isNetworkError ? 'Gagal Terhubung' : 'Gagal Memuat Distribusi'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null
  const isEmpty = data.length === 0

  const stats = useMemo(() => {
    let lancar = 0
    let sedang = 0
    let ulang = 0

    data.forEach(d => {
      if (d.skorKualitas >= 4) lancar++
      else if (d.skorKualitas === 3) sedang++
      else if (d.skorKualitas >= 1) ulang++
    })

    const total = lancar + sedang + ulang
    if (total === 0) return null

    return {
      lancar: { count: lancar, pct: Math.round((lancar / total) * 100) },
      sedang: { count: sedang, pct: Math.round((sedang / total) * 100) },
      ulang: { count: ulang, pct: Math.round((ulang / total) * 100) },
      total
    }
  }, [data])

  return (
    <Card className="w-full h-full shadow-sm border-slate-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-emerald-600" />
          Distribusi Kualitas Juz
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {!stats || isEmpty ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center mt-2 h-[150px] flex flex-col justify-center items-center">
            <p className="text-sm font-bold text-slate-700">Belum Ada Data</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-600">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Lancar
                </span>
                <span>{stats.lancar.count} Juz ({stats.lancar.pct}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${stats.lancar.pct}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-600">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div> Sedang
                </span>
                <span>{stats.sedang.count} Juz ({stats.sedang.pct}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-amber-400 h-3 rounded-full" style={{ width: `${stats.sedang.pct}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-600">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Perlu Ulang
                </span>
                <span>{stats.ulang.count} Juz ({stats.ulang.pct}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-rose-500 h-3 rounded-full" style={{ width: `${stats.ulang.pct}%` }}></div>
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { AlertTriangle, TrendingUp, TrendingDown, Target, Info, WifiOff, CheckCircle2 } from 'lucide-react'

interface EstimasiKhatamProps {
  data?: {
    sisaHalaman: number
    pacePerSesi: number
    estimasiHariTersisa: number | null
    onTrackStatus: 'on_track' | 'tertinggal' | null
    guardStatus: 'ok' | 'data_belum_cukup'
    targetTanggalSelesai: string | null
  }
  isLoading?: boolean
  error?: { message: string, code?: string } | null
}

function formatEstimasiRentang(hari: number) {
  if (hari < 7) return { utama: 'Segera khatam', sub: 'Kurang dari seminggu' }
  if (hari < 30) {
    const m = Math.round(hari / 7)
    const minM = Math.max(1, m - 1)
    const maxM = m + 1
    return { 
      utama: `≈ ${minM}-${maxM} minggu lagi`,
      sub: `Sekitar ${m} minggu ke depan`
    }
  }
  const b = Math.round(hari / 30)
  const minB = Math.max(1, b - 1)
  const maxB = b + 1
  
  const m = Math.round(hari / 7)
  return {
    utama: `≈ ${minB}-${maxB} bulan lagi`,
    sub: `Sekitar ${m} minggu ke depan`
  }
}

export function EstimasiKhatam({ data, isLoading, error }: EstimasiKhatamProps) {
  if (isLoading) {
    return (
      <Card className="w-full h-full animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground bg-muted h-5 w-32 rounded"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted w-24 rounded mb-2"></div>
          <div className="h-4 bg-muted w-48 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    const isNetworkError = error.code === 'NETWORK_ERROR'
    return (
      <Card className={`w-full h-full ${isNetworkError ? 'border-orange-200 bg-orange-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-2">
          {isNetworkError ? <WifiOff className="h-8 w-8 text-orange-500" /> : <AlertTriangle className="h-8 w-8 text-rose-500" />}
          <p className={`text-sm font-medium ${isNetworkError ? 'text-orange-600' : 'text-rose-600'}`}>
            {isNetworkError ? 'Gagal Terhubung' : 'Gagal Memuat'}
          </p>
          <p className={`text-xs ${isNetworkError ? 'text-orange-500' : 'text-rose-500'}`}>{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  // State: Sudah Khatam
  if (data.sisaHalaman === 0) {
    return (
      <Card className="w-full h-full border-emerald-200 bg-emerald-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Estimasi Khatam
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-emerald-100 rounded-md border border-emerald-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-800">Alhamdulillah, Khatam!</h4>
              <p className="text-xs text-emerald-600 mt-0.5">Semoga istiqomah menjaga hafalannya.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Guard Status: Data Belum Cukup
  if (data.guardStatus === 'data_belum_cukup') {
    return (
      <Card className="w-full h-full bg-slate-50 border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Estimasi Khatam
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start gap-3 p-3 bg-slate-100 rounded-md border border-slate-200">
            <Info className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-600 leading-relaxed">
              Estimasi kecepatan hafalan akan tersedia setelah santri menyetorkan ziyadah secara konsisten (minimal 3 sesi).
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Guard Status: OK
  const { utama, sub } = data.estimasiHariTersisa 
    ? formatEstimasiRentang(data.estimasiHariTersisa)
    : { utama: '-', sub: 'Belum dapat diestimasi' }

  const isOnTrack = data.onTrackStatus === 'on_track'
  const hasTarget = !!data.targetTanggalSelesai

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" />
          Estimasi Khatam
        </CardTitle>
        {hasTarget && data.onTrackStatus && (
          <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
            isOnTrack 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {isOnTrack ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {isOnTrack ? 'On Track' : 'Tertinggal'}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {utama}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {sub}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Kecepatan</p>
              <p className="text-sm font-semibold text-slate-700">
                {data.pacePerSesi > 0 ? `${data.pacePerSesi.toFixed(1)} hal/sesi` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Sisa Hafalan</p>
              <p className="text-sm font-semibold text-slate-700">
                {data.sisaHalaman} halaman
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

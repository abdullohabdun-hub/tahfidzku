import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { AlertTriangle, WifiOff, Activity, PieChart as PieChartIcon } from 'lucide-react'
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  Line
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { KATEGORI_COLORS } from '../../constants/kategori-colors'

interface GrafikAnalitikSantriProps {
  data?: {
    displayMode?: 'tahfidz' | 'iqra'
    tipeSantri: 'reguler' | 'dewasa'
    grafikHarian: {
      tanggal: string
      jenis: 'ziyadah' | 'sabqi' | 'manzil' | 'iqra'
      totalHalaman: number
      totalSetoran: number
    }[]
    rasioMingguan?: {
      minggu: string
      ziyadahHalaman: number
      murojaahHalaman: number
    }[]
    kualitasDistribusi?: {
      skorKualitas: number
      totalSetoran: number
    }[]
    smartSummary: {
      totalSetoran: number
      totalHalaman: number
      kehadiran: {
        hadir: number
        izin: number
        sakit: number
        alpa: number
        hadirTanpaSetoran: number
      }
    }
  }
  isLoading?: boolean
  error?: { message: string, code?: string } | null
  hideRapor?: boolean
  hideDonut?: boolean
}

const COLORS = {
  ziyadah: KATEGORI_COLORS.ziyadah.hex,
  sabqi: KATEGORI_COLORS.sabqi.hex,
  manzil: KATEGORI_COLORS.manzil.hex,
  setoranDewasa: '#d946ef', // fuchsia-500
  murojaahTotal: '#0ea5e9' // sky-500
}

export function GrafikAnalitikSantri({ data, isLoading, error, hideRapor, hideDonut }: GrafikAnalitikSantriProps) {
  // 1. PIVOT GRAFIK HARIAN
  const harianData = useMemo(() => {
    if (!data?.grafikHarian) return []
    const map = new Map<string, { tanggalRaw: string, tanggal: string, ziyadah: number, sabqi: number, manzil: number, iqra: number, scatterDewasa?: number }>()
    
    data.grafikHarian.forEach(item => {
      if (!map.has(item.tanggal)) {
        // Inisialisasi default 0 untuk semua jenis agar area render Recharts konsisten
        map.set(item.tanggal, {
          tanggalRaw: item.tanggal,
          tanggal: format(parseISO(item.tanggal), 'd MMM', { locale: id }),
          ziyadah: 0,
          sabqi: 0,
          manzil: 0,
          iqra: 0
        })
      }
      const entry = map.get(item.tanggal)!
      
      if (item.jenis === 'iqra') {
        entry.iqra += item.totalHalaman
      } else {
        entry[item.jenis as 'ziyadah' | 'sabqi' | 'manzil'] += item.totalHalaman
      }
      
      // Marker titik ziyadah khusus untuk santri dewasa
      if (data.tipeSantri === 'dewasa' && item.jenis === 'ziyadah' && item.totalHalaman > 0) {
        entry.scatterDewasa = entry.ziyadah
      }
    })
    
    return Array.from(map.values()).sort((a, b) => a.tanggalRaw.localeCompare(b.tanggalRaw))
  }, [data?.grafikHarian, data?.tipeSantri])

  // 2. AGREGASI RASIO MINGGUAN UNTUK DONUT
  const { totalZiyadah, totalMurojaah, donutData, donutIqraData, totalIqraDonut } = useMemo(() => {
    let tZiyadah = 0
    let tMurojaah = 0
    let dData: any[] = []
    
    let tIqraDonut = 0
    let dIqraData: any[] = []

    if (data?.displayMode === 'iqra') {
      if (data.kualitasDistribusi) {
        const SKOR_LABELS = ['-', 'Sangat Kurang', 'Kurang Lancar', 'Lancar', 'Sangat Lancar', 'Mumtaz']
        const SKOR_COLORS = ['#e2e8f0', '#ef4444', '#f59e0b', '#8b5cf6', '#7c3aed', '#6d28d9'] // Violet palette
        
        data.kualitasDistribusi.forEach(item => {
          tIqraDonut += item.totalSetoran
          dIqraData.push({
            name: SKOR_LABELS[item.skorKualitas] || 'Unknown',
            value: item.totalSetoran,
            fill: SKOR_COLORS[item.skorKualitas] || SKOR_COLORS[0]
          })
        })
      }
    } else {
      if (data?.rasioMingguan) {
        tZiyadah = data.rasioMingguan.reduce((sum, r) => sum + r.ziyadahHalaman, 0)
        tMurojaah = data.rasioMingguan.reduce((sum, r) => sum + r.murojaahHalaman, 0)
        dData = [
          { name: 'Ziyadah', value: tZiyadah, fill: COLORS.ziyadah },
          { name: 'Murojaah (Sabqi & Manzil)', value: tMurojaah, fill: COLORS.murojaahTotal }
        ]
      }
    }
    
    return {
      totalZiyadah: tZiyadah,
      totalMurojaah: tMurojaah,
      donutData: dData,
      donutIqraData: dIqraData,
      totalIqraDonut: tIqraDonut
    }
  }, [data?.rasioMingguan, data?.displayMode, data?.kualitasDistribusi])

  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="h-5 w-40 bg-muted rounded"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted rounded-md mt-4"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    const isNetworkError = error.code === 'NETWORK_ERROR'
    return (
      <Card className={`w-full ${isNetworkError ? 'border-orange-200 bg-orange-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-2 h-[300px]">
          {isNetworkError ? <WifiOff className="h-8 w-8 text-orange-500" /> : <AlertTriangle className="h-8 w-8 text-rose-500" />}
          <p className={`text-sm font-medium ${isNetworkError ? 'text-orange-600' : 'text-rose-600'}`}>
            {isNetworkError ? 'Gagal Terhubung' : 'Gagal Memuat Analitik'}
          </p>
          <p className={`text-xs ${isNetworkError ? 'text-orange-500' : 'text-rose-500'}`}>{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const isHarianEmpty = harianData.length === 0
  const isDonutEmpty = data.displayMode === 'iqra' ? (totalIqraDonut === 0) : (totalZiyadah + totalMurojaah === 0)
  const isZiyadahExtreme = data.displayMode !== 'iqra' && totalZiyadah > 0 && totalMurojaah === 0
  const isMurojaahExtreme = data.displayMode !== 'iqra' && totalMurojaah > 0 && totalZiyadah === 0
  const isExtremeRatio = isZiyadahExtreme || isMurojaahExtreme

  return (
    <div className="space-y-4">
      {/* 1. Grafik Aktivitas Harian */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {data.displayMode === 'iqra' ? 'Tren Halaman (14 Hari)' : 'Aktivitas Harian (14 Hari)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isHarianEmpty ? (
            <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm italic">
              Belum ada aktivitas tercatat
            </div>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={harianData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  {data.displayMode === 'iqra' ? (
                    <Line type="monotone" dataKey="iqra" name="Halaman" stroke={KATEGORI_COLORS.iqraViolet.hex} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  ) : (
                    <>
                      <Bar dataKey="ziyadah" name="Ziyadah" stackId="a" fill={COLORS.ziyadah} />
                      <Bar dataKey="sabqi" name="Sabqi" stackId="a" fill={COLORS.sabqi} />
                      <Bar dataKey="manzil" name="Manzil" stackId="a" fill={COLORS.manzil} />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className={`grid grid-cols-1 ${(!hideDonut && !hideRapor) ? 'sm:grid-cols-2' : ''} gap-4`}>
        {/* Donut Chart */}
        {!hideDonut && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              {data.displayMode === 'iqra' ? 'Distribusi Kualitas Bacaan' : 'Keseimbangan (8 Minggu)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col justify-center h-full min-h-[220px]">
            {isDonutEmpty ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">Belum ada aktivitas tercatat</div>
            ) : isExtremeRatio ? (
              <div className="flex-1 w-full flex items-center justify-center">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full text-left">
                  <p className="text-xs text-amber-700">Fokus hafalan terlalu ekstrem. Seimbangkan Ziyadah dan Murojaah.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.displayMode === 'iqra' ? donutIqraData : donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {(data.displayMode === 'iqra' ? donutIqraData : donutData).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [data.displayMode === 'iqra' ? `${value} setoran` : `${value} halaman`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 mt-2 w-full px-4">
                  {(data.displayMode === 'iqra' ? donutIqraData : donutData).map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.fill }}></div>
                      <span className="flex-1 truncate">{entry.name}</span>
                      <span className="font-bold">{entry.value} {data.displayMode === 'iqra' ? 'setoran' : 'hal'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* Smart Summary */}
        {!hideRapor && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Rapor Minggu Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Total Capaian</p>
                  <p className="text-lg font-bold text-slate-800">{data.smartSummary.totalHalaman} <span className="text-sm font-normal text-slate-500">hal</span></p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Total Setoran</p>
                  <p className="text-lg font-bold text-slate-800">{data.smartSummary.totalSetoran} <span className="text-sm font-normal text-slate-500">kali</span></p>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Rekap Kehadiran</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium border border-emerald-100">
                    Hadir: {data.smartSummary.kehadiran.hadir}
                  </span>
                  {data.smartSummary.kehadiran.izin > 0 && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-100">
                      Izin: {data.smartSummary.kehadiran.izin}
                    </span>
                  )}
                  {data.smartSummary.kehadiran.sakit > 0 && (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                      Sakit: {data.smartSummary.kehadiran.sakit}
                    </span>
                  )}
                  {data.smartSummary.kehadiran.alpa > 0 && (
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded text-xs font-medium border border-rose-100">
                      Alpa: {data.smartSummary.kehadiran.alpa}
                    </span>
                  )}
                  {data.smartSummary.kehadiran.hadirTanpaSetoran > 0 && (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">
                      Hadir Tnp Setor: {data.smartSummary.kehadiran.hadirTanpaSetoran}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  )
}

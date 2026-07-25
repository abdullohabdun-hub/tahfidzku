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
  Cell
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

interface GrafikAnalitikSantriProps {
  data?: {
    tipeSantri: 'reguler' | 'dewasa'
    grafikHarian: {
      tanggal: string
      jenis: 'ziyadah' | 'sabqi' | 'manzil'
      totalHalaman: number
      totalSetoran: number
    }[]
    rasioMingguan: {
      minggu: string
      ziyadahHalaman: number
      murojaahHalaman: number
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
}

const COLORS = {
  ziyadah: '#3b82f6', // blue-500
  sabqi: '#10b981',   // emerald-500
  manzil: '#f59e0b',  // amber-500
  murojaahTotal: '#10b981' // emerald-500 (gabungan di donut)
}

export function GrafikAnalitikSantri({ data, isLoading, error }: GrafikAnalitikSantriProps) {
  // 1. PIVOT GRAFIK HARIAN
  const harianData = useMemo(() => {
    if (!data?.grafikHarian) return []
    const map = new Map<string, { tanggalRaw: string, tanggal: string, ziyadah: number, sabqi: number, manzil: number, scatterDewasa?: number }>()
    
    data.grafikHarian.forEach(item => {
      if (!map.has(item.tanggal)) {
        // Inisialisasi default 0 untuk semua jenis agar area render Recharts konsisten
        map.set(item.tanggal, {
          tanggalRaw: item.tanggal,
          tanggal: format(parseISO(item.tanggal), 'd MMM', { locale: id }),
          ziyadah: 0,
          sabqi: 0,
          manzil: 0
        })
      }
      const entry = map.get(item.tanggal)!
      entry[item.jenis] += item.totalHalaman
      
      // Marker titik ziyadah khusus untuk santri dewasa
      if (data.tipeSantri === 'dewasa' && item.jenis === 'ziyadah' && item.totalHalaman > 0) {
        entry.scatterDewasa = entry.ziyadah
      }
    })
    
    return Array.from(map.values()).sort((a, b) => a.tanggalRaw.localeCompare(b.tanggalRaw))
  }, [data?.grafikHarian, data?.tipeSantri])

  // 2. AGREGASI RASIO MINGGUAN UNTUK DONUT
  const { totalZiyadah, totalMurojaah, donutData } = useMemo(() => {
    if (!data?.rasioMingguan) return { totalZiyadah: 0, totalMurojaah: 0, donutData: [] }
    
    const ziyadah = data.rasioMingguan.reduce((sum, r) => sum + r.ziyadahHalaman, 0)
    const murojaah = data.rasioMingguan.reduce((sum, r) => sum + r.murojaahHalaman, 0)
    
    return {
      totalZiyadah: ziyadah,
      totalMurojaah: murojaah,
      donutData: [
        { name: 'Ziyadah', value: ziyadah, fill: COLORS.ziyadah },
        { name: 'Murojaah (Sabqi & Manzil)', value: murojaah, fill: COLORS.murojaahTotal }
      ]
    }
  }, [data?.rasioMingguan])

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
  const isDonutEmpty = totalZiyadah + totalMurojaah === 0

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Grafik Harian */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Aktivitas Harian (14 Hari Terakhir)
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
                  <XAxis 
                    dataKey="tanggal" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  />
                  <Bar dataKey="ziyadah" name="Ziyadah" stackId="a" fill={COLORS.ziyadah} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="sabqi" name="Sabqi" stackId="a" fill={COLORS.sabqi} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="manzil" name="Manzil" stackId="a" fill={COLORS.manzil} radius={[4, 4, 0, 0]} />
                  
                  {data.tipeSantri === 'dewasa' && (
                    <Scatter dataKey="scatterDewasa" name="Setoran Dewasa" fill="#1e40af" />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Donut & Smart Summary Grid (Mobile = Stack, sm+ = Grid 2 Kolom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Donut Chart */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Keseimbangan (8 Minggu)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center justify-center">
            {isDonutEmpty ? (
              <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm italic">
                Belum ada aktivitas tercatat
              </div>
            ) : (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value} halaman`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend Kustom Donut */}
                <div className="flex justify-center gap-4 text-xs font-medium text-slate-600 w-full mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Ziyadah ({(totalZiyadah / (totalZiyadah + totalMurojaah) * 100).toFixed(0)}%)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    Murojaah ({(totalMurojaah / (totalZiyadah + totalMurojaah) * 100).toFixed(0)}%)
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Smart Summary */}
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
      </div>
    </div>
  )
}

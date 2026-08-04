import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

export interface WeeklySetoranChartProps {
  data: { tanggal: string; nama: string; jumlah: number }[]
  isLoading?: boolean
}

export function WeeklySetoranChart({ data, isLoading }: WeeklySetoranChartProps) {
  // Fallback awal (SSR safe)
  const [primaryColor, setPrimaryColor] = React.useState("oklch(0.596 0.145 163.2)")
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    // Ambil warna CSS variable saat runtime agar adaptif terhadap perubahan tema
    const rootStyles = getComputedStyle(document.documentElement)
    const primary = rootStyles.getPropertyValue("--primary").trim()
    
    if (primary) {
      // styles.css mendeklarasikan --primary sebagai oklch(0.596 0.145 163.2)
      // Namun di beberapa versi tailwind, format variabel bisa plain value
      const hasColorFunction = primary.startsWith("oklch") || primary.startsWith("#") || primary.startsWith("hsl") || primary.startsWith("rgb")
      setPrimaryColor(hasColorFunction ? primary : `oklch(${primary})`)
    }
  }, [])

  if (isLoading || !isMounted) {
    return (
      <div className="h-64 w-full flex items-center justify-center p-4">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="nama" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip 
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{ 
              borderRadius: "8px", 
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
            }}
            formatter={(value) => [`${value} setoran`, "Jumlah"]}
            labelStyle={{ color: "#475569", fontWeight: 600, marginBottom: "4px" }}
          />
          <Bar 
            dataKey="jumlah" 
            fill={primaryColor} 
            radius={[4, 4, 0, 0]} 
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

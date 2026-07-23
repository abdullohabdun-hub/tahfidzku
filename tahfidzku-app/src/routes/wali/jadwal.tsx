import { createFileRoute } from "@tanstack/react-router"
import { CalendarDays } from "lucide-react"

export const Route = createFileRoute('/wali/jadwal')({
  component: JadwalPage,
})

function JadwalPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center text-center h-[60vh] text-slate-500">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <CalendarDays className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-700 mb-2">Jadwal Halaqoh</h2>
      <p className="text-sm">Fitur jadwal halaqoh sedang dalam tahap pengembangan.</p>
    </div>
  )
}

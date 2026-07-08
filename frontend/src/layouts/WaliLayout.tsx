import { Outlet, Link, useLocation } from "react-router-dom"
import { PieChart, CalendarDays, User, Award } from "lucide-react"

export default function WaliLayout() {
  const location = useLocation()

  const navItems = [
    { name: "Progres", path: "/wali", icon: <PieChart className="w-6 h-6" /> },
    { name: "Jadwal", path: "/wali/jadwal", icon: <CalendarDays className="w-6 h-6" /> },
    { name: "Ujian", path: "/wali/ujian", icon: <Award className="w-6 h-6" /> },
    { name: "Profil", path: "/wali/profil", icon: <User className="w-6 h-6" /> },
  ]

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 pb-[76px]">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex justify-center items-center shadow-sm">
        <h1 className="font-bold text-lg text-slate-800 tracking-tight">Pemantauan Hafalan</h1>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
        <div className="flex justify-around items-center h-[65px]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors
                  ${isActive ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}
                `}
              >
                {item.icon}
                <span className="text-[11px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}

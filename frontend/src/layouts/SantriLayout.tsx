import { Outlet, Link, useLocation } from "react-router-dom"
import { Home, PencilLine, User, Award } from "lucide-react"

export default function SantriLayout() {
  const location = useLocation()

  const navItems = [
    { name: "Beranda", path: "/santri", icon: <Home className="w-7 h-7" /> },
    { name: "Lapor", path: "/santri/input", icon: <PencilLine className="w-7 h-7" /> },
    { name: "Ujian", path: "/santri/ujian", icon: <Award className="w-7 h-7" /> },
    { name: "Profil", path: "/santri/profil", icon: <User className="w-7 h-7" /> },
  ]

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 pb-[76px]">
      
      {/* Top Header */}
      <header className="bg-emerald-700 text-white p-5 sticky top-0 z-50 flex justify-between items-center shadow-md rounded-b-2xl">
        <div>
          <h1 className="font-bold text-xl leading-tight">Ahlan, Bapak Fulan!</h1>
          <p className="text-sm text-emerald-100 mt-1">Tetap Semangat Murojaah Hari Ini 💪</p>
        </div>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar (Mobile) - Larger for older people */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-[76px]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors
                  ${isActive ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}
                `}
              >
                {item.icon}
                <span className="text-xs font-bold">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}

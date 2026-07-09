import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router"
import { Home, PlusCircle, History, User, Award, Clock, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { checkAuth, logout } from "../server-fns/auth"
import { getTenantInfo } from "../server-fns/admin-settings"

export const Route = createFileRoute('/ustadz')({
  component: UstadzLayout,
})

function UstadzLayout() {
  const location = useLocation()
  const [user, setUser] = useState<any>(null)
  const [tenantName, setTenantName] = useState('Memuat...')

  useEffect(() => {
    async function loadProfile() {
      const auth = await checkAuth()
      if (auth) {
        setUser(auth)
        const tenantRes = await getTenantInfo()
        if (tenantRes.success && tenantRes.data) {
          setTenantName(tenantRes.data.namaLembaga)
        }
      }
    }
    loadProfile()
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const navItems = [
    { name: "Beranda", path: "/ustadz", icon: <Home className="w-6 h-6" /> },
    { name: "Input", path: "/ustadz/input", icon: <PlusCircle className="w-6 h-6" /> },
    { name: "Pantau Murojaah", path: "/ustadz/pantau", icon: <Clock className="w-6 h-6" /> },
    { name: "Ujian", path: "/ustadz/ujian", icon: <Award className="w-6 h-6" /> },
    { name: "Riwayat", path: "/ustadz/riwayat", icon: <History className="w-6 h-6" /> },
    { name: "Profil", path: "/ustadz/profil", icon: <User className="w-6 h-6" /> },
  ]

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 pb-16">
      
      {/* Simple Top Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-lg text-emerald-950 leading-tight">{tenantName}</h1>
          <p className="text-xs text-slate-500">Ustadz {user?.nama || "..."}</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200 uppercase">
            {user?.nama ? user.nama.substring(0, 2) : "US"}
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
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
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}

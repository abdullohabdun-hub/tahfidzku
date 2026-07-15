import { createFileRoute, Outlet, Link, useLocation, useRouter } from "@tanstack/react-router"
import { Home, PlusCircle, History, Award, Clock, LogOut, BookOpen } from "lucide-react"
import { useState, useEffect } from "react"
import { checkAuth, logout } from "../server-fns/auth"
import { getTenantInfo } from "../server-fns/admin-settings"

export const Route = createFileRoute('/ustadz')({
  component: UstadzLayout,
})

function UstadzLayout() {
  const location = useLocation()
  const router = useRouter()
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
    router.invalidate()
    router.navigate({ to: '/login' })
  }

  const navItems = [
    { name: "Beranda", path: "/ustadz", icon: <Home className="w-5 h-5" /> },
    { name: "Input", path: "/ustadz/input", icon: <PlusCircle className="w-5 h-5" /> },
    { name: "Pantau", path: "/ustadz/pantau", icon: <Clock className="w-5 h-5" /> },
    { name: "Ujian", path: "/ustadz/ujian", icon: <Award className="w-5 h-5" /> },
    { name: "Riwayat", path: "/ustadz/riwayat", icon: <History className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20 md:pb-0">
      
      {/* Top Header (Logo) */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-md">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base text-emerald-950 tracking-tight">{tenantName} Ustadz</span>
        </div>
        <div className="flex gap-3 items-center">
          <Link to="/ustadz/profil" className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200 uppercase text-xs md:text-sm hover:ring-2 hover:ring-emerald-500 hover:bg-emerald-200 transition-all cursor-pointer">
            {user?.nama ? user.nama.substring(0, 2) : "US"}
          </Link>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors md:hidden">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 md:p-6 md:pl-[17rem] md:max-w-4xl transition-all">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-14 z-50 px-1 pb-safe shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-emerald-600" : "text-slate-500 hover:text-emerald-500"
              }`}
            >
              <div className={`${isActive ? "scale-110 transition-transform" : ""}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop Sidebar (Optional, if viewed on PC) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex-col z-40 shadow-sm">
        <div className="p-6 flex items-center gap-2 border-b border-slate-100">
          <div className="bg-emerald-600 p-1.5 rounded-md">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-emerald-950 truncate" title={tenantName}>{tenantName}</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                  ${isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}
                `}
              >
                <div className={`${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                  {item.icon}
                </div>
                {item.name === "Pantau" ? "Pantau Murojaah" : item.name}
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-2.5 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-semibold text-sm">Keluar Akun</span>
          </button>
        </div>
      </aside>

    </div>
  )
}

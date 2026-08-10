import { createFileRoute, Outlet, Link, useLocation, useRouter } from "@tanstack/react-router"
import { Home, PlusCircle, History, Award, Clock, LogOut, BookOpen, Calendar, BarChart3 } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { checkAuth, logout } from "../server-fns/auth"
import { getTenantInfo } from "../server-fns/admin-settings"
import { HelpTicketButton } from "../components/tiket/HelpTicketButton"
import { useServerFn } from "@tanstack/react-start"
import { getUnreadCount } from "../server-fns/notifikasi-ustadz"
import { Bell } from "lucide-react"
import { RoleSwitcher } from "../components/shared/RoleSwitcher"
import { formatDateWithHijri } from "../lib/hijri-date"

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
      try {
        const auth = await checkAuth()
        if (auth) {
          setUser(auth)
          const tenantRes = await getTenantInfo()
          if (tenantRes.success && tenantRes.data) {
            setTenantName(tenantRes.data.namaLembaga)
          }
        }
      } catch (err) {
        console.error('Failed to load layout profile:', err)
        setTenantName('TahfidzKu')
      }
    }
    loadProfile()
  }, [])

  const [unreadCount, setUnreadCount] = useState(0)
  const fetchUnreadCount = useServerFn(getUnreadCount)

  useEffect(() => {
    if (!user) return
    const checkCount = async () => {
      try {
        const count = await fetchUnreadCount()
        setUnreadCount(count)
      } catch (e) {
        // ignore
      }
    }
    checkCount()
    const interval = setInterval(checkCount, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [user, fetchUnreadCount])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      router.invalidate()
      router.navigate({ to: '/login' })
    }
  }

  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(formatDateWithHijri(new Date(), { includeWeekday: true }))
  }, [])

  const getWaktuGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 3 && hour < 11) return "Selamat pagi"
    if (hour >= 11 && hour < 15) return "Selamat siang"
    if (hour >= 15 && hour < 18) return "Selamat sore"
    return "Selamat malam"
  }

  const navItems = [
    { name: "Beranda", path: "/ustadz", icon: <Home className="w-5 h-5" /> },
    { name: "Input", path: "/ustadz/input", icon: <PlusCircle className="w-5 h-5" /> },
    { name: "Absensi", path: "/ustadz/absensi", icon: <Calendar className="w-5 h-5" /> },
    { name: "Riwayat", path: "/ustadz/riwayat", icon: <History className="w-5 h-5" /> },
    { name: "Analitik", path: "/ustadz/analitik", icon: <BarChart3 className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20 md:pb-0">
      
      {/* Top Header (Disederhanakan: RoleSwitcher + Action Icons + Sapaan & Tanggal) */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 sticky top-0 z-50 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {user?.roles && user.roles.length > 1 ? (
              <RoleSwitcher user={user} currentRole="ustadz" />
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Ustadz
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <HelpTicketButton baseUrl="/ustadz/tiket" />
            <Link to="/ustadz/notifikasi" className="relative p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
              )}
            </Link>
            <Link to="/ustadz/profil" className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200 uppercase hover:ring-2 hover:ring-emerald-500 transition-all">
              {user?.nama ? user.nama.substring(0, 2) : "US"}
            </Link>
            <button onClick={handleLogout} className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-colors md:hidden" title="Keluar">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Line 2: Sapaan Waktu + Nama & Tanggal */}
        <div className="flex flex-col pt-1.5 border-t border-slate-100 mt-2">
          <h1 className="text-sm font-bold text-slate-800 leading-tight">
            {getWaktuGreeting()}, <span className="text-emerald-700">{user?.nama || "Ustadz"}</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">
            {today}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 md:p-6 md:pl-[17rem] md:max-w-4xl transition-all pb-28 md:pb-6">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-14 z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1 group"
            >
              <div className={`relative flex items-center justify-center p-1.5 rounded-full transition-all duration-300 ${isActive ? "text-emerald-700 bg-emerald-100/80 shadow-sm" : "text-slate-500 group-hover:text-emerald-600"}`}>
                <div className={`${isActive ? "scale-110" : "scale-100"} transition-transform duration-300`}>
                  {item.icon}
                </div>
              </div>
              <span className={`text-[10px] transition-all duration-300 ${isActive ? "font-bold text-emerald-800" : "font-medium text-slate-500"}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop Sidebar (Optional, if viewed on PC) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/60 flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
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

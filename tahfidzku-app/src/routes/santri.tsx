import { createFileRoute, Outlet, Link, useLocation, useRouter } from "@tanstack/react-router"
import { Home, PencilLine, Award, BookOpen, LogOut, History, Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { checkAuth, logout } from "../server-fns/auth"
import { HelpTicketButton } from "../components/tiket/HelpTicketButton"
import { useServerFn } from "@tanstack/react-start"
import { getUnreadCountSantri } from "../server-fns/notifikasi-santri"
import { formatDateWithHijri } from "../lib/hijri-date"

export const Route = createFileRoute('/santri')({
  loader: async () => {
    try {
      const auth = await checkAuth()
      return { user: auth }
    } catch (err) {
      return { user: null }
    }
  },
  component: SantriLayout,
})

function SantriLayout() {
  const location = useLocation()
  const router = useRouter()
  const loaderData = Route.useLoaderData()
  const [user, setUser] = useState<any>(loaderData?.user || null)
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(formatDateWithHijri(new Date(), { includeWeekday: true }))
  }, [])

  useEffect(() => {
    if (loaderData?.user) {
      setUser(loaderData.user)
    }
  }, [loaderData?.user])

  const [unreadCount, setUnreadCount] = useState(0)
  const fetchUnreadCount = useServerFn(getUnreadCountSantri)

  useEffect(() => {
    if (!user || user.role !== 'santri') return
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

  const navItems = [
    { name: "Beranda", path: "/santri", icon: <Home className="w-5 h-5" /> },
    { name: "Lapor", path: "/santri/input", icon: <PencilLine className="w-5 h-5" /> },
    { name: "Riwayat", path: "/santri/riwayat", icon: <History className="w-5 h-5" /> },
    { name: "Ujian", path: "/santri/ujian", icon: <Award className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20 md:pb-0">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 sticky top-0 z-50 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-emerald-700 leading-tight">
              {user?.nama || "Santri"}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">
              {today}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpTicketButton baseUrl="/santri/tiket" />
            <Link to="/santri/notifikasi" className="relative p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
              )}
            </Link>
            <Link to="/santri/profil" className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200 uppercase hover:ring-2 hover:ring-emerald-500 transition-all">
              {user?.nama ? user.nama.substring(0, 2) : "SA"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 md:p-6">
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
          <span className="font-bold text-xl tracking-tight text-emerald-950 truncate">TahfidzKu</span>
          <Link to="/santri/notifikasi" className="relative ml-auto p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </Link>
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
                {item.name}
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-2.5 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </button>
        </div>
      </aside>
      
      {/* Desktop Main Content Spacer */}
      <div className="hidden md:block md:pl-64 flex-1">
        {/* The Outlet is already rendered above in max-w-md, we can just center it for desktop too */}
      </div>

    </div>
  )
}

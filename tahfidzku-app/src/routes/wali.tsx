import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router"
import { PieChart, CalendarDays, User, Award, Home } from "lucide-react"
import { useState, useEffect } from "react"
import { HelpTicketButton } from "../components/tiket/HelpTicketButton"
import { getWaliLayout } from "../server-fns/wali-layout"
import { checkAuth } from "../server-fns/auth"
import { formatDateWithHijri } from "../lib/hijri-date"

export const Route = createFileRoute('/wali')({
  component: WaliLayout,
  loader: async () => {
    try {
      const res = await getWaliLayout()
      if (!res.success) {
        throw new Error(res.error?.message || 'Gagal memuat layout')
      }
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  staleTime: 60 * 60 * 1000, // Cache for 1 hour
})

function WaliLayout() {
  const location = useLocation()
  const layoutData = Route.useLoaderData()
  const [user, setUser] = useState<any>(null)
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(formatDateWithHijri(new Date(), { includeWeekday: true }))
    async function loadProfile() {
      try {
        const auth = await checkAuth()
        if (auth) {
          setUser(auth)
        }
      } catch (err) {
        console.error('Failed to load wali profile:', err)
      }
    }
    loadProfile()
  }, [])

  const navItems = [
    { name: "Beranda", path: "/wali", icon: <Home className="w-5 h-5" strokeWidth={1.5} /> },
    { name: "Progres", path: "/wali/progres", icon: <PieChart className="w-5 h-5" strokeWidth={1.5} /> },
    { name: "Jadwal", path: "/wali/jadwal", icon: <CalendarDays className="w-5 h-5" strokeWidth={1.5} /> },
    { name: "Ujian", path: "/wali/ujian", icon: <Award className="w-5 h-5" strokeWidth={1.5} /> },
    { name: "Profil", path: "/wali/profil", icon: <User className="w-5 h-5" strokeWidth={1.5} /> },
  ]

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 pb-[76px]">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 sticky top-0 z-50 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-emerald-700 leading-tight">
              {user?.nama || "Wali"}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">
              {today}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpTicketButton baseUrl="/wali/tiket" />
            <Link to="/wali/profil" className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200 uppercase hover:ring-2 hover:ring-emerald-500 transition-all">
              {user?.nama ? user.nama.substring(0, 2) : "WA"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
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
                className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200
                  ${isActive ? "text-emerald-600 space-y-1" : "text-slate-400 hover:text-slate-600"}
                `}
              >
                <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>
                  {item.icon}
                </div>
                {isActive && (
                  <span className="text-[10px] font-medium leading-none">{item.name}</span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}

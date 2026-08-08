import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router"
import { PieChart, CalendarDays, User, Award, Home } from "lucide-react"
import { HelpTicketButton } from "../components/tiket/HelpTicketButton"
import { getWaliLayout } from "../server-fns/wali-layout"

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

  const navItems = [
    { name: "Beranda", path: "/wali", icon: <Home className="w-5 h-5" strokeWidth={1.5} /> },
    { name: "Progres", path: "/wali/progres", icon: <PieChart className="w-5 h-5" strokeWidth={1.5} /> },
    { name: "Jadwal", path: "/wali/jadwal", icon: <CalendarDays className="w-5 h-5" strokeWidth={1.5} /> },
    { name: "Ujian", path: "/wali/ujian", icon: <Award className="w-5 h-5" strokeWidth={1.5} /> },
    { name: "Profil", path: "/wali/profil", icon: <User className="w-5 h-5" strokeWidth={1.5} /> },
  ]

  const isBeranda = location.pathname === "/wali" || location.pathname === "/wali/"

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 pb-[76px]">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        {isBeranda ? (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
              {layoutData?.namaLembaga?.charAt(0) || 'T'}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Aplikasi Wali</span>
              <span className="text-sm font-bold text-slate-800 leading-tight">{layoutData?.namaLembaga || 'Tahfidzku'}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="w-9" /> {/* Spacer to keep title centered */}
            <h1 className="font-bold text-lg text-slate-800 tracking-tight">
              {location.pathname.startsWith('/wali/progres') ? 'Pemantauan' :
               location.pathname.startsWith('/wali/jadwal') ? 'Jadwal' :
               location.pathname.startsWith('/wali/ujian') ? 'Ujian' :
               location.pathname.startsWith('/wali/profil') ? 'Profil' : 'Tahfidzku'}
            </h1>
          </>
        )}
        <HelpTicketButton baseUrl="/wali/tiket" />
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

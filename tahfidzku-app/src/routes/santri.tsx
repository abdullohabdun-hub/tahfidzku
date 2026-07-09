import { createFileRoute, Outlet, Link, useLocation, useRouter } from "@tanstack/react-router"
import { Home, PencilLine, User, Award, BookOpen, LogOut } from "lucide-react"
import { logout } from "../server-fns/auth"

export const Route = createFileRoute('/santri')({
  component: SantriLayout,
})

function SantriLayout() {
  const location = useLocation()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.invalidate()
    router.navigate({ to: '/login' })
  }

  const navItems = [
    { name: "Beranda", path: "/santri", icon: <Home className="w-7 h-7" /> },
    { name: "Lapor", path: "/santri/input", icon: <PencilLine className="w-7 h-7" /> },
    { name: "Ujian", path: "/santri/ujian", icon: <Award className="w-7 h-7" /> },
    { name: "Profil", path: "/santri/profil", icon: <User className="w-7 h-7" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20 md:pb-0">
      
      {/* Top Header (Logo) */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-md">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-emerald-950 tracking-tight">TahfidzKu Santri</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors md:hidden">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 md:p-6">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
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
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex-col z-40">
        <div className="p-6 flex items-center gap-2 border-b border-slate-100">
          <div className="bg-emerald-600 p-1.5 rounded-md">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-emerald-950">TahfidzKu</span>
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

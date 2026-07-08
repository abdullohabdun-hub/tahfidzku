import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router"
import { BookOpen, Users, UserSquare2, Home, Settings, LogOut, Menu } from "lucide-react"
import { useState } from "react"
import { Button } from "../components/ui/button"

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: <Home className="w-5 h-5" /> },
    { name: "Data Ustadz", path: "/admin/ustadz", icon: <UserSquare2 className="w-5 h-5" /> },
    { name: "Data Santri", path: "/admin/santri", icon: <Users className="w-5 h-5" /> },
    { name: "Kelas / Halaqoh", path: "/admin/kelas", icon: <BookOpen className="w-5 h-5" /> },
    { name: "Pengaturan", path: "/admin/pengaturan", icon: <Settings className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-md">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-emerald-950">TahfidzKu Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6 text-slate-600" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-6 hidden md:flex items-center gap-2 border-b border-slate-100">
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
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                  ${isActive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}
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
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-slate-800">
            {navItems.find(item => item.path === location.pathname)?.name || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-medium text-slate-900">Ustadz Ahmad</p>
              <p className="text-slate-500 text-xs">Pesantren Darussalam</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              UA
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>

    </div>
  )
}

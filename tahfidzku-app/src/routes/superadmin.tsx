import { createFileRoute, Link, Outlet, redirect, useRouter } from '@tanstack/react-router'
import { checkAuth, logout } from '../server-fns/auth'
import { LayoutDashboard, Building2, LogOut, Loader2, Menu, X, ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/superadmin')({
  beforeLoad: async () => {
    const user = await checkAuth()
    if (!user) {
      throw redirect({ to: '/login' })
    }
    if (!(user as any).isSuperAdmin) {
      throw redirect({ to: '/' })
    }
    return { user }
  },
  component: SuperAdminLayout,
})

function SuperAdminLayout() {
  const { user } = Route.useRouteContext()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [router.state.location.pathname])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.invalidate()
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    { name: 'Dashboard', to: '/superadmin', icon: LayoutDashboard, exact: true },
    { name: 'Manajemen Lembaga', to: '/superadmin/lembaga', icon: Building2 },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 flex overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 
          bg-white text-slate-600 
          flex flex-col shrink-0 
          transition-all duration-300 ease-in-out border-r border-slate-200
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-16' : 'w-72 md:w-64'}
        `}
      >
        <div className={`p-4 flex items-center h-16 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {isCollapsed ? (
              <h2 className="font-bold text-xl text-emerald-600">S</h2>
            ) : (
              <div className="whitespace-nowrap opacity-100 transition-opacity">
                <h2 className="font-bold text-base tracking-tight text-slate-900">Super Admin</h2>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">TahfidzKu SaaS</p>
              </div>
            )}
          </div>
          
          {/* Mobile Close Button */}
          <button 
            className="md:hidden p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-900"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Menu Utama
            </div>
          )}
          
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: 'bg-emerald-50 text-emerald-700 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-emerald-600 before:rounded-r-full' }}
              activeOptions={{ exact: item.exact }}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                hover:text-slate-900 hover:bg-slate-100 transition-all group
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 mt-auto">
          <div className={`bg-slate-50 rounded-xl border border-slate-200 flex items-center ${isCollapsed ? 'p-2 justify-center' : 'p-3 gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              {user.nama.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{user.nama}</p>
                <p className="text-xs text-slate-500 truncate">{user.username}</p>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost"
            className={`w-full mt-2 hover:bg-rose-50 hover:text-rose-600 text-slate-500 ${isCollapsed ? 'px-0 justify-center' : 'justify-start gap-2'}`}
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isCollapsed ? "Keluar Sistem" : undefined}
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {!isCollapsed && "Keluar Sistem"}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              className="hidden md:flex p-1.5 -ml-4 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

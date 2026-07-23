import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { User, LogOut } from "lucide-react"
import { logout } from "../../server-fns/auth"
import { Button } from "../../components/ui/button"
import { ChangePasswordForm } from "../../components/ChangePasswordForm"

export const Route = createFileRoute('/wali/profil')({
  component: ProfilPage,
})

function ProfilPage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar?')) return
    await logout()
    navigate({ to: '/login', replace: true })
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex flex-col items-center justify-center text-center mb-8 mt-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Profil Wali Santri</h2>
        <p className="text-sm text-slate-500 mt-1">Pengaturan akun Anda</p>
      </div>

      <ChangePasswordForm role="wali" />

      <div className="mt-8">
        <Button onClick={handleLogout} variant="destructive" className="w-full flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          Keluar (Logout)
        </Button>
      </div>
    </div>
  )
}

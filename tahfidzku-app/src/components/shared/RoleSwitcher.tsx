import { useState } from 'react'
import { Loader2, ChevronDown, Check } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { switchRoleFn } from '../../server-fns/switch-role'
import { toast } from '../ui/sonner'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu'

import type { SessionUser } from '../../middleware/auth.middleware'

interface RoleSwitcherProps {
  user: SessionUser;
  currentRole: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  ustadz: 'Ustadz',
  santri: 'Santri',
  wali: 'Wali'
}

export function RoleSwitcher({ user, currentRole }: RoleSwitcherProps) {
  const switchRole = useServerFn(switchRoleFn)
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)

  // Hanya tampil jika user memiliki lebih dari 1 role
  if (!user?.roles || user.roles.length <= 1) return null

  const handleSwitch = async (targetRole: string) => {
    if (targetRole === currentRole) return
    setSwitchingTo(targetRole)
    try {
      const res = await switchRole({ data: { targetRole: targetRole as any } })
      if (res.success && res.data) {
        window.location.href = res.data.redirectUrl
      } else {
        toast.error((!res.success ? res.error?.message : 'Gagal beralih role') as string)
        setSwitchingTo(null)
      }
    } catch (err) {
      toast.error('Gagal terhubung ke server')
      setSwitchingTo(null)
    }
  }

  const availableRoles = user.roles as string[]

  return (
    <div className="hidden sm:block ml-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full text-xs font-semibold text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5"></span>
          {ROLE_LABELS[currentRole] || currentRole}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Beralih Akses
          </div>
          {availableRoles.map(r => (
            <DropdownMenuItem 
              key={r} 
              onClick={() => handleSwitch(r)}
              disabled={switchingTo !== null}
              className={r === currentRole ? "bg-slate-50 cursor-default" : ""}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`font-medium ${r === currentRole ? 'text-primary' : 'text-slate-700'}`}>
                  {ROLE_LABELS[r] || r}
                </span>
                {switchingTo === r ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                ) : r === currentRole ? (
                  <Check className="w-3.5 h-3.5 text-primary" />
                ) : null}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

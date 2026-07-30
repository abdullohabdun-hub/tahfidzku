import { Link } from '@tanstack/react-router'
import { LifeBuoy } from 'lucide-react'

export function HelpTicketButton({ baseUrl }: { baseUrl: string }) {
  return (
    <Link
      to={baseUrl}
      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors relative group flex items-center justify-center"
      title="Bantuan / Tiket"
    >
      <LifeBuoy className="w-5 h-5" />
      {/* Tooltip for desktop (optional, since title attribute is already there) */}
      <span className="absolute -bottom-8 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block z-50">
        Bantuan
      </span>
    </Link>
  )
}

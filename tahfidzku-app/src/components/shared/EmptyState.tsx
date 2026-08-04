import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * EmptyState component - Tampilan terstruktur untuk state data kosong
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="Belum ada data santri"
 *   description="Silakan tambah santri baru untuk memulai pendaftaran peserta didik."
 *   action={{ label: "Tambah Santri", onClick: () => setShowForm(true) }}
 * />
 * ```
 */
export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-xl border border-slate-200 border-dashed my-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-semibold text-slate-800 text-base">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="default" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}

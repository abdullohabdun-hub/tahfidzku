import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * StatCard component - Kartu statistik utama dengan tone semantik
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Santri"
 *   value={120}
 *   icon={Users}
 *   description="Santri aktif terdaftar"
 *   tone="neutral"
 * />
 * ```
 */
export interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  description?: string
  tone?: "neutral" | "warning" | "danger"
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  tone = "neutral",
  className,
}: StatCardProps) {
  const toneStyles = {
    neutral: {
      iconBg: "bg-slate-100 text-slate-700 border-slate-200",
      badgeBg: "bg-slate-50",
    },
    warning: {
      iconBg: "bg-amber-50 text-amber-700 border-amber-200",
      badgeBg: "bg-amber-50/50",
    },
    danger: {
      iconBg: "bg-rose-50 text-rose-700 border-rose-200",
      badgeBg: "bg-rose-50/50",
    },
  }

  const selectedTone = toneStyles[tone] || toneStyles.neutral

  return (
    <div
      className={cn(
        "bg-white rounded-xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group transition-all duration-200 hover:border-slate-300",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0", selectedTone.iconBg)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {description && <p className="text-xs text-slate-500 mt-4">{description}</p>}
    </div>
  )
}

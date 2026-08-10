import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * StatCard component - Kartu statistik utama dengan tone semantik & layout horizontal compact
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Santri Setor Hari Ini"
 *   value="0/9"
 *   unit="santri"
 *   icon={Users}
 *   tone="neutral"
 * />
 * ```
 */
export interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  unit?: string
  badge?: string
  badgeVariant?: "amber" | "emerald" | "rose" | "slate"
  description?: string
  tone?: "neutral" | "warning" | "danger" | "success"
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  unit,
  badge,
  badgeVariant,
  description,
  tone = "neutral",
  className,
}: StatCardProps) {
  const toneStyles = {
    neutral: {
      iconBg: "bg-slate-100 text-slate-600 border-slate-200/80",
      defaultBadge: "bg-slate-100 text-slate-600 border-slate-200/80",
    },
    warning: {
      iconBg: "bg-amber-50 text-amber-700 border-amber-200/80",
      defaultBadge: "bg-amber-50 text-amber-700 border-amber-200/80",
    },
    danger: {
      iconBg: "bg-rose-50 text-rose-700 border-rose-200/80",
      defaultBadge: "bg-rose-50 text-rose-700 border-rose-200/80",
    },
    success: {
      iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      defaultBadge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
  }

  const badgeVariantStyles = {
    slate: "bg-slate-100 text-slate-600 border-slate-200/80",
    amber: "bg-amber-50 text-amber-700 border-amber-200/80",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    rose: "bg-rose-50 text-rose-700 border-rose-200/80",
  }

  const selectedTone = toneStyles[tone] || toneStyles.neutral
  const selectedBadgeStyle = badgeVariant
    ? badgeVariantStyles[badgeVariant]
    : selectedTone.defaultBadge

  return (
    <div
      className={cn(
        "bg-white rounded-xl p-3 shadow-xs border border-slate-200/90 flex items-center justify-between transition-all duration-200 hover:border-slate-300 min-w-0",
        className
      )}
    >
      <div className="min-w-0 flex-1 pr-1.5">
        <p className="text-[11px] sm:text-xs font-medium text-slate-500 truncate leading-snug">{label}</p>
        <div className="flex items-baseline gap-1 mt-0.5 flex-wrap min-w-0">
          <span className="text-xl font-semibold text-slate-800 tracking-tight leading-tight">{value}</span>
          {unit && <span className="text-xs font-normal text-slate-400 leading-tight">{unit}</span>}
          {badge && (
            <span
              className={cn(
                "text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-full border leading-none shrink-0 truncate max-w-full",
                selectedBadgeStyle
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 leading-tight">{description}</p>
        )}
      </div>
      <div className={cn("p-2 rounded-lg border shrink-0 flex items-center justify-center ml-1", selectedTone.iconBg)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}


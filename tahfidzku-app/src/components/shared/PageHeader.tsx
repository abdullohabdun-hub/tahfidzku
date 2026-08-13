import * as React from "react"

/**
 * PageHeader component - Standar judul + deskripsi + aksi utama halaman Admin
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Data Santri"
 *   description="Kelola master data peserta didik."
 *   action={<Button>Tambah Santri</Button>}
 * />
 * ```
 */
export interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-3 ${className}`}>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="text-slate-400 text-xs mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

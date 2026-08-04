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
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

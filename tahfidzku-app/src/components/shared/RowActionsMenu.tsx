import * as React from "react"
import { MoreHorizontal, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface ActionItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: "default" | "destructive"
  entityName?: string
  /** Override judul dialog konfirmasi. Default: "Konfirmasi Penghapusan" */
  confirmTitle?: string
  /** Override deskripsi dialog konfirmasi. Default: pola hapus dengan entityName. */
  confirmDescription?: string
  /** Override label tombol aksi di dialog. Default: "Hapus Data" */
  confirmActionLabel?: string
}

/**
 * RowActionsMenu component - Menu aksi per baris tabel dengan AlertDialog konfirmasi otomatis untuk aksi destruktif.
 *
 * @example
 * ```tsx
 * <RowActionsMenu
 *   actions={[
 *     { label: 'Edit', icon: Edit, onClick: () => handleEdit(row) },
 *     { label: 'Hapus', icon: Trash, onClick: () => handleDelete(row.id), variant: 'destructive', entityName: row.nama }
 *   ]}
 * />
 * ```
 */
export interface RowActionsMenuProps {
  actions: ActionItem[]
}

export function RowActionsMenu({ actions }: RowActionsMenuProps) {
  const [pendingDestructiveAction, setPendingDestructiveAction] = React.useState<ActionItem | null>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Aksi lainnya"
              className="text-slate-500 hover:text-slate-900"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          }
        />
        <DropdownMenuContent>
          {actions.map((action, i) => {
            const Icon = action.icon
            const isDestructive = action.variant === "destructive"

            return (
              <DropdownMenuItem
                key={i}
                onClick={() => {
                  if (isDestructive) {
                    setPendingDestructiveAction(action)
                  } else {
                    action.onClick()
                  }
                }}
                className={isDestructive ? "text-rose-600 focus:text-rose-600 focus:bg-rose-50" : ""}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span>{action.label}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog for Destructive Actions */}
      <AlertDialog
        open={!!pendingDestructiveAction}
        onOpenChange={(open) => {
          if (!open) setPendingDestructiveAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDestructiveAction?.confirmTitle ?? "Konfirmasi Penghapusan"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDestructiveAction?.confirmDescription ?? (
                <>
                  Apakah Anda yakin ingin menghapus{" "}
                  <strong className="text-slate-900 font-semibold">
                    {pendingDestructiveAction?.entityName || "data ini"}
                  </strong>
                  ? Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDestructiveAction) {
                  pendingDestructiveAction.onClick()
                  setPendingDestructiveAction(null)
                }
              }}
            >
              {pendingDestructiveAction?.confirmActionLabel ?? "Hapus Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

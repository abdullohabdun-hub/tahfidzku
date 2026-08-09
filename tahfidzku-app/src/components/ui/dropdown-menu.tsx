import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "@/lib/utils"

function DropdownMenu({ ...props }: React.ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root {...props} />
}

function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger {...props} />
}

function DropdownMenuContent({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  alignOffset = 0,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Popup> & {
  align?: React.ComponentProps<typeof MenuPrimitive.Positioner>["align"]
  side?: React.ComponentProps<typeof MenuPrimitive.Positioner>["side"]
  sideOffset?: number
  alignOffset?: number
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} className="z-[100]">
        <MenuPrimitive.Popup
          className={cn(
            "min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-md animate-in fade-in-80",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Item>) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}

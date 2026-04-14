import * as React from "react"
import { cn } from "@/lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-11 w-full min-w-0 appearance-none rounded-xl border bg-[rgba(196,172,120,0.05)] px-4 py-2 text-sm text-[#EDE6D6] transition-all outline-none cursor-pointer",
        "border-[rgba(196,172,120,0.14)]",
        "focus:border-[rgba(196,172,120,0.36)] focus:ring-1 focus:ring-[rgba(196,172,120,0.20)]",
        "disabled:pointer-events-none disabled:opacity-40",
        "[&>option]:bg-[#161C24] [&>option]:text-[#EDE6D6]",
        className
      )}
      {...props}
    />
  )
}

export { Select }

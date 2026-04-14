import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-xl border bg-[rgba(196,172,120,0.05)] px-4 py-3 text-sm text-[#EDE6D6] transition-all outline-none resize-none",
        "border-[rgba(196,172,120,0.14)] placeholder:text-[#6A7888]",
        "focus:border-[rgba(196,172,120,0.36)] focus:ring-1 focus:ring-[rgba(196,172,120,0.20)]",
        "disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

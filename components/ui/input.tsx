import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// Neon Dojo input: #0D0D1A bg, #2A2A40 border, #00FFB2 focus ring
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border bg-[rgba(196,172,120,0.05)] px-4 py-2 text-sm text-[#EDE6D6] transition-all outline-none",
        "placeholder:text-[#6A7888]",
        "border-[rgba(196,172,120,0.14)] focus-visible:border-[rgba(196,172,120,0.36)] focus-visible:ring-1 focus-visible:ring-[rgba(196,172,120,0.20)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "aria-invalid:border-[rgba(160,104,104,0.40)]",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#EDE6D6]",
        className
      )}
      {...props}
    />
  )
}

export { Input }

import * as React from "react"

import { cn } from "@/lib/utils"

// Neon Dojo card: #11111C bg, 8px radius, 1px #2A2A40 border
// Optional left accent stripe via card-accent-primary / card-accent-danger utility

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden py-5 text-sm text-card-foreground has-data-[slot=card-footer]:pb-0 data-[size=sm]:gap-3 data-[size=sm]:py-3",
        className
      )}
      style={{
        background: "rgba(196,172,120,0.04)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(196,172,120,0.18)",
        borderLeft: "1px solid rgba(196,172,120,0.12)",
        borderRight: "1px solid rgba(196,172,120,0.06)",
        borderBottom: "1px solid rgba(196,172,120,0.04)",
        borderRadius: 18,
        boxShadow: "0 2px 4px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(196,172,120,0.06)",
        position: "relative",
      }}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-5 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base font-semibold leading-snug tracking-tight group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-4 group-data-[size=sm]/card:p-3", className)}
      style={{ borderTop: "1px solid rgba(196,172,120,0.09)", background: "rgba(196,172,120,0.02)", borderRadius: "0 0 18px 18px" }}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

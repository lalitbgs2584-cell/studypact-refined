import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border bg-clip-padding font-sans text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(196,172,120,0.14)] text-[#D4C090] border-t-[rgba(212,192,144,0.38)] border-l-[rgba(196,172,120,0.28)] border-r-[rgba(196,172,120,0.18)] border-b-[rgba(160,136,64,0.22)] shadow-[0_0_14px_rgba(196,172,120,0.14),0_4px_20px_rgba(196,172,120,0.08)] hover:bg-[rgba(196,172,120,0.22)] hover:-translate-y-0.5 hover:shadow-[0_0_22px_rgba(196,172,120,0.22),0_8px_32px_rgba(196,172,120,0.12)] active:scale-[0.97]",
        outline:
          "bg-[rgba(196,172,120,0.05)] text-[rgba(237,230,214,0.80)] border-t-[rgba(196,172,120,0.20)] border-l-[rgba(196,172,120,0.14)] border-r-[rgba(196,172,120,0.09)] border-b-[rgba(196,172,120,0.07)] shadow-[inset_0_1px_0_rgba(196,172,120,0.06),0_2px_8px_rgba(0,0,0,0.40)] hover:bg-[rgba(196,172,120,0.10)] hover:text-[#D4C090] hover:-translate-y-0.5 active:scale-[0.97]",
        secondary:
          "bg-[rgba(196,172,120,0.05)] text-[#A09880] border-[rgba(196,172,120,0.12)] hover:bg-[rgba(196,172,120,0.09)] hover:text-[#EDE6D6] active:scale-[0.97]",
        ghost:
          "bg-transparent text-[rgba(80,100,120,0.90)] border-transparent hover:bg-[rgba(196,172,120,0.05)] hover:text-[rgba(237,230,214,0.90)] hover:border-[rgba(196,172,120,0.10)] active:scale-[0.97]",
        destructive:
          "bg-[rgba(160,104,104,0.08)] text-[#C08888] border-t-[rgba(192,136,136,0.28)] border-l-[rgba(160,104,104,0.22)] border-r-[rgba(160,104,104,0.14)] border-b-[rgba(160,104,104,0.10)] hover:bg-[rgba(160,104,104,0.14)] active:scale-[0.97]",
        link: "text-[#C4AC78] underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        default: "h-10 gap-1.5 px-4 rounded-xl",
        xs:      "h-7 gap-1 px-3 text-xs rounded-lg",
        sm:      "h-9 gap-1 px-3.5 text-sm rounded-xl",
        lg:      "h-11 gap-1.5 px-5 rounded-xl",
        icon:    "size-10 rounded-xl",
        "icon-xs": "size-7 rounded-lg",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

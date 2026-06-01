import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Liquid Glass button variants — iOS 26 design language.
// Why:
// - Active scale-95: spring-bounce feedback (Apple haptic vibe).
// - 1px white/8 % inner border: glass-on-glass katmanlı yüzeylerde sınır
//   sıvı kalır; sertleşmesin.
// - `transition-spring`: cubic-bezier(0.32, 0.72, 0, 1) ile spring damping.
// - Primary: Hangel brand kırmızısı korunur — glass overlay altında shine.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-[transform,background-color,color,box-shadow,opacity] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Default (Primary glass red — Hangel brand): brand color underneath glass
        // sheen. Inner border + soft shadow Apple "tinted glass" replica.
        default:
          "bg-primary text-primary-foreground border border-white/15 shadow-glass-soft hover:bg-primary/90 hover:shadow-glass-prominent",
        // Destructive: red glass — confirmation/dangerous actions.
        destructive:
          "bg-destructive text-destructive-foreground border border-white/15 shadow-glass-soft hover:bg-destructive/90",
        // Outline: subtle glass tile (no fill) — secondary CTAs on glass surfaces.
        outline:
          "glass-thin border-primary/40 text-primary hover:bg-primary/10",
        // Secondary (glass white): translucent neutral panel.
        secondary:
          "glass-thin text-secondary-foreground hover:bg-glass-white-20 dark:hover:bg-glass-white-12",
        // Ghost: transparent — hover'da hafif glass tile.
        ghost:
          "text-foreground hover:bg-glass-black-5 dark:hover:bg-glass-white-8 hover:text-primary",
        // Link: tipografik link — glass kullanmaz.
        link: "text-primary underline-offset-4 hover:underline rounded-md",
      },
      size: {
        // 44pt minimum (Apple HIG) — touch-friendly.
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

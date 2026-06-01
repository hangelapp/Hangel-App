import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Liquid Glass badge — small chip surface.
// Why: badge `glass-thin` ile satır içi yüzeylerde altta kalan rengi geçirir
// (kart üstü etiket akar, sertleşmez). Brand renkleri varyantta korunur.
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-white/15 bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-white/15 bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-glass-black-12 dark:border-glass-white-12 text-foreground",
        // Glass-thin: tek tip translucent chip — alttaki rengi geçirir.
        glass: "glass-thin text-foreground border-glass-black-8 dark:border-glass-white-12",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

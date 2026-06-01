"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * GlassSurface — yeniden kullanılabilir Liquid Glass wrapper.
 *
 * Tek bir component üzerinden tutarlı glass katmanı eklemek için.
 * Yeni bir surface tasarlarken `<Card>` yerine, kart anatomisine sahip
 * olmayan ama glass yüzey isteyen (örn. sticky toolbar, floating badge
 * grup, in-page banner) yerlerde tercih edilir.
 *
 * Variant'lar `globals.css` içindeki utility class'larıyla birebir eşleşir
 * (`.glass`, `.glass-prominent`, `.glass-thin`). Semantik HTML elementi
 * gerekiyorsa `asChild` prop'u ile `<Slot>` deseni kullanılır (Radix UI
 * konvansiyonu) — `<GlassSurface asChild><section>…</section></GlassSurface>`.
 *
 * @example
 * ```tsx
 * <GlassSurface variant="prominent" className="p-6 rounded-3xl">
 *   <h2>Hero başlık</h2>
 * </GlassSurface>
 *
 * <GlassSurface variant="thin" asChild>
 *   <section className="p-4">Semantic section</section>
 * </GlassSurface>
 * ```
 */
const glassSurfaceVariants = cva("relative", {
  variants: {
    variant: {
      default: "glass",
      prominent: "glass-prominent",
      thin: "glass-thin",
    },
    radius: {
      none: "",
      sm: "rounded-lg",
      md: "rounded-2xl",
      lg: "rounded-3xl",
      full: "rounded-full",
    },
    shadow: {
      none: "",
      soft: "shadow-glass-soft",
      prominent: "shadow-glass-prominent",
    },
  },
  defaultVariants: {
    variant: "default",
    radius: "lg",
    shadow: "soft",
  },
})

export interface GlassSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassSurfaceVariants> {
  /** `<Slot>` deseni — child element render eder (semantik tag için). */
  asChild?: boolean
}

const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  (
    { className, variant, radius, shadow, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        ref={ref}
        className={cn(
          glassSurfaceVariants({ variant, radius, shadow }),
          className
        )}
        {...props}
      />
    )
  }
)
GlassSurface.displayName = "GlassSurface"

export { GlassSurface, glassSurfaceVariants }

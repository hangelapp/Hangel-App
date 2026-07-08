import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, enterKeyHint = "next", ...props }, ref) => {
    return (
      <input
        type={type}
        enterKeyHint={enterKeyHint}
        className={cn(
          // scroll-mt-24: klavye/sticky-header açılınca odaklanılan input yukarıda
          // kalsın (scrollIntoView'de üstten 6rem boşluk) → input klavyenin altında
          // veya header'ın arkasında kalmaz. text-base (16px) mobilde iOS zoom'u önler.
          "flex h-10 w-full scroll-mt-24 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

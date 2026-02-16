import * as React from "react"

import { cn } from "@/lib/utils"

export const HangelLogo = (props: React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} className={cn("font-bold text-primary", props.className)}>
    hangel
  </span>
)


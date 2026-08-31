"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // House checkbox: 20px, #CDD1DC at rest and the brand #6A35FF once
        // checked — the same pair the inputs use for their resting and focus
        // borders. No shadow. White tick sits at 5.9:1 on the purple.
        "peer border-[#CDD1DC] dark:bg-input/30 data-[state=checked]:bg-[#6A35FF] data-[state=checked]:text-white dark:data-[state=checked]:bg-[#6A35FF] data-[state=checked]:border-[#6A35FF] focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-5 shrink-0 cursor-pointer rounded-[4px] border outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        {/* `text-current` is load-bearing beyond the colour it sets: cmdk's
            CommandItem paints any descendant svg grey via
            `[&_svg:not([class*='text-'])]:text-muted-foreground`, and that
            direct rule beats the white inherited from the root. Carrying a
            `text-` class puts the tick outside that selector. */}
        <CheckIcon className="size-3.5 text-current" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

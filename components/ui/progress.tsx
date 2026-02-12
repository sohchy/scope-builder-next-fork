"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

type Segment = {
  value: number;
  color?: string;
  colorClass?: string;
};

export interface ProgressProps extends React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> {
  value?: number;
  total?: number;
  segments?: Segment[];
  progressClassname?: string;
}

function Progress({
  value,
  total,
  segments,
  className,
  progressClassname,
  ...props
}: ProgressProps) {
  const hasSegments = !!segments && segments.length > 0;

  const computedTotal =
    total ??
    (hasSegments ? segments!.reduce((acc, s) => acc + s.value, 0) : 100);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      value={hasSegments ? computedTotal : value}
      {...props}
    >
      {hasSegments ? (
        <div className="flex h-full w-full">
          {segments!.map((segment, idx) => {
            const widthPct =
              computedTotal === 0 ? 0 : (segment.value / computedTotal) * 100;
            return (
              <div
                key={idx}
                className={cn("h-full ", segment.colorClass)}
                style={{
                  width: `${widthPct}%`,
                }}
              />
            );
          })}
        </div>
      ) : (
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "bg-primary h-full w-full flex-1 transition-all",
            progressClassname,
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      )}
    </ProgressPrimitive.Root>
  );
}

export { Progress };

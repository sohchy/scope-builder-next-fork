import React from "react";
import clsx from "clsx";
import { cn } from "@/lib/utils";

export function StepClip({
  variant,
  active,
  children,
  completed,
}: {
  variant: "first" | "middle";
  active?: boolean;
  completed?: boolean;
  children?: React.ReactNode;
}) {
  const base = cn(
    "h-12 px-6 flex items-center justify-center text-sm font-medium",
    variant === "first" ? "rounded-lg" : "",
    active && !completed ? "bg-[#6935FD] text-white border-[#6935FD]" : "",
    !active && completed ? "bg-white text-gray-700" : "",
    !active && !completed ? "bg-[#D5D3FB]" : ""
  );

  console.log("active", active);

  // Middle: left notch + right arrow
  // Coordinates are percentages; tweak until it matches your screenshot.
  const middleClip =
    "polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%, 6% 50%)";

  const startClip =
    "polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%, 0% 50%)";

  // First: normal rounded pill (no clip)
  return (
    <div
      className={base}
      style={
        variant === "middle"
          ? { clipPath: middleClip }
          : { clipPath: startClip }
      }
    >
      {children}
    </div>
  );
}

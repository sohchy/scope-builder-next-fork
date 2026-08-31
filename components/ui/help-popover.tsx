"use client";

import { CircleHelpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HELP_CONTENT, type HelpKey } from "@/lib/helpContent";

interface HelpPopoverProps {
  /**
   * Names the copy in `HELP_CONTENT`. Without one the question mark still
   * renders, but as decoration — nothing opens.
   */
  helpKey?: HelpKey;
  /**
   * What the help is about, e.g. the heading it sits beside. The button has no
   * text of its own, so this is what a screen reader announces.
   */
  label?: string;
  side?: React.ComponentProps<typeof PopoverContent>["side"];
  align?: React.ComponentProps<typeof PopoverContent>["align"];
  /** Extra classes for the icon itself, e.g. to resize or recolour it. */
  className?: string;
}

/**
 * A question mark that opens its help copy in a popover.
 *
 * The copy is authored in `lib/helpContent.ts` and referenced by key, so this
 * component is the only place that renders it — and the only place that has to
 * trust it as markup.
 */
export function HelpPopover({
  helpKey,
  label,
  side = "bottom",
  align = "start",
  className,
}: HelpPopoverProps) {
  const help = helpKey && HELP_CONTENT[helpKey];

  const icon = (
    <CircleHelpIcon
      className={cn("w-4 h-4 text-gray-600 shrink-0", className)}
    />
  );

  if (!help) return icon;

  return (
    <Popover>
      {/* Only the icon opens the popover, so a heading beside it stays a
          heading. The negative margin widens the 16px icon to a touchable
          target without moving anything around it. */}
      <PopoverTrigger asChild>
        <button
          type="button"
          className="-m-1 p-1 cursor-pointer"
          aria-label={label ? `Help: ${label}` : "Help"}
        >
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-[min(24rem,calc(100vw-2rem))] text-sm leading-relaxed text-gray-700 [&_a]:text-[#6A35FF] [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ul]:mt-2 [&_p+p]:mt-2"
        dangerouslySetInnerHTML={{ __html: help }}
      />
    </Popover>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ZapIcon, PlayIcon, GitForkIcon } from "lucide-react";
import type { JourneyNodeType } from "../JourneyContext";

interface NodeTypeMenuProps {
  /** Viewport rect of the "+" button — used to position the menu via fixed coordinates. */
  anchorRect: DOMRect;
  onSelect: (type: JourneyNodeType) => void;
  onClose: () => void;
}

const OPTIONS: {
  type: JourneyNodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "trigger",
    label: "Trigger / Motivation",
    description: "Starts the journey",
    icon: <ZapIcon className="w-3.5 h-3.5 text-indigo-500" />,
  },
  {
    type: "action",
    label: "Action",
    description: "What a user does at a particular step",
    icon: <PlayIcon className="w-3.5 h-3.5 text-blue-500" />,
  },
  {
    type: "split_route",
    label: "Scenario",
    description: "Create independent branches",
    icon: <GitForkIcon className="w-3.5 h-3.5 text-orange-500" />,
  },
];

export function NodeTypeMenu({
  anchorRect,
  onSelect,
  onClose,
}: NodeTypeMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown, true);
    return () =>
      document.removeEventListener("mousedown", handleMouseDown, true);
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: anchorRect.top + anchorRect.height / 2,
        left: anchorRect.right + 12,
        transform: "translateY(-50%)",
        zIndex: 9999,
      }}
      className="w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {OPTIONS.map(({ type, label, description, icon }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className="grid w-full grid-cols-[auto_1fr] items-center gap-x-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
        >
          {/* Row one is the icon and the title, so its height is the title's own
              line box and `items-center` seats the icon on the title's middle —
              no hardcoded height tracking whatever `text-sm` resolves to. The
              wrapper has to be `flex`: an SVG is inline, so as a bare block it
              would take an inherited line box taller than the icon and push the
              row out of step. */}
          <div className="flex flex-shrink-0">{icon}</div>
          <div className="text-sm font-medium text-gray-800">{label}</div>
          {/* Row two, second column — clear of the icon gutter. */}
          <div className="col-start-2 text-xs text-gray-400 leading-snug">
            {description}
          </div>
        </button>
      ))}
    </div>,
    document.body,
  );
}

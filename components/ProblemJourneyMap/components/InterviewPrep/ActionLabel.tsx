"use client";

interface ActionLabelProps {
  /** The action card's text, as typed on the canvas. "" = never filled in. */
  action: string;
  className?: string;
}

/**
 * The action a problem hangs off, shown above its "Problem" pill so the user can
 * tell which journey step they are writing or answering questions for. Repeated on
 * every problem — the cards are read one at a time. Shared by the prep tab and the
 * answering view.
 */
export function ActionLabel({ action, className }: ActionLabelProps) {
  const text = action.trim();

  return (
    <p
      className={[
        "text-sm font-medium",
        text ? "text-[#697288]" : "text-[#9AA0B0] italic",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {text || "Untitled action"}
    </p>
  );
}

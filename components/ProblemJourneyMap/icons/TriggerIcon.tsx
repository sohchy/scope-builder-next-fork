/** The designer's lightning bolt for Trigger / Motivation cards.
 *
 * Ships at its exported 16x16, which already carries the padding the artwork
 * needs — unlike the first export, whose ink ran to the edge of an 11x15 box.
 * `currentColor` so the parent's text class drives the fill. */
export function TriggerIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8.8176 1.76532C8.87323 1.68439 9 1.72376 9 1.82197V6.4C9 6.45523 9.04477 6.5 9.1 6.5H12.3099C12.3904 6.5 12.4379 6.5903 12.3923 6.65665L7.1824 14.2347C7.12677 14.3156 7 14.2762 7 14.178V9.6C7 9.54477 6.95523 9.5 6.9 9.5H3.6901C3.60959 9.5 3.56208 9.4097 3.6077 9.34335L8.8176 1.76532Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

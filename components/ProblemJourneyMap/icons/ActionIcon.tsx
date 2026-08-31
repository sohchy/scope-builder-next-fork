/** The designer's play triangle for Action cards. See `TriggerIcon` for why the
 * exported 16x16 box is kept rather than sized by utility classes. */
export function ActionIcon({ className }: { className?: string }) {
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
        d="M12.528 7.73775C12.7337 7.85205 12.7337 8.14795 12.528 8.26225L4.44569 12.7524C4.24573 12.8635 4 12.7189 4 12.4901L4 3.50985C4 3.28111 4.24573 3.13652 4.44569 3.24761L12.528 7.73775Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

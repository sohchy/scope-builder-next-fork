// Small glyphs for the ad-lib captions, drawn after the value proposition
// canvas's shapes (a square for the value map, a circle for the customer
// profile) rather than copied from the Strategyzer artwork. 16x16 and
// `currentColor`, same as the journey map's TriggerIcon / ActionIcon.

interface IconProps {
  className?: string;
}

/** Products and Services: the value-map square with its arrow filled in. */
export function ProductsIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="2.5" width="12" height="11" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 2.5L9 8L2 13.5Z" fill="currentColor" />
    </svg>
  );
}

/** Competing value proposition: the same square, left hollow. */
export function CompetingIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="2.5" width="12" height="11" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 2.5L9 8L2 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/** Customer Segment: the customer-profile circle. */
export function SegmentIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 9.5C5.5 11 6.6 11.6 8 11.6C9.4 11.6 10.5 11 11.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Jobs to be done: the profile circle, its jobs third filled. */
export function JobsIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 8L8 2A6 6 0 0 0 2.8 11Z" fill="currentColor" />
    </svg>
  );
}

/** Customer pain: the profile circle, its pains third filled. */
export function PainIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 8L2.8 11A6 6 0 0 0 13.2 11Z" fill="currentColor" />
    </svg>
  );
}

/** Customer gain: the profile circle, its gains third filled. */
export function GainIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 8L13.2 11A6 6 0 0 0 8 2Z" fill="currentColor" />
    </svg>
  );
}

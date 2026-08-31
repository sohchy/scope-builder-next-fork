import Image from "next/image";

// Technology adoption lifecycle ("crossing the chasm") curve.
export function BeachheadChart({ className }: { className?: string }) {
  return (
    <Image
      src="/chart.png"
      alt="Technology adoption lifecycle curve showing the chasm between the early market and the mainstream market"
      width={600}
      height={350}
      className={className}
    />
  );
}

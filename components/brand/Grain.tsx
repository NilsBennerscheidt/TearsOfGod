import { cn } from "@/lib/cn";

interface GrainProps {
  opacity?: number;
  blend?: React.CSSProperties["mixBlendMode"];
  className?: string;
}

/** SVG feTurbulence noise overlay. Decorative — never carries content. */
export function Grain({ opacity = 0.18, blend = "multiply", className }: GrainProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-50 bg-[length:200px_200px] bg-[image:var(--grain-url)]",
        className,
      )}
      style={{ opacity, mixBlendMode: blend }}
    />
  );
}

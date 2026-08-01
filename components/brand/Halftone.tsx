import { cn } from "@/lib/cn";

interface HalftoneProps {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}

/** CSS radial-gradient dot pattern. Decorative — never carries content. */
export function Halftone({ size = 4, color = "var(--color-pitch)", opacity = 0.9, className }: HalftoneProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `radial-gradient(${color} 1px, transparent 1.1px)`,
        backgroundSize: `${size}px ${size}px`,
        opacity,
      }}
    />
  );
}

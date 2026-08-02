import { TearHalo } from "@/components/brand/TearHalo";
import { cn } from "@/lib/cn";

interface LoadingSpinnerProps {
  size?: number;
  /** Accessible label — the only text a screen reader gets, since the mark itself is aria-hidden. */
  label?: string;
  className?: string;
}

/**
 * The brand mark (ring + rays + mask, see TearHalo) sped up into a
 * loading indicator via TearHalo's `fast` prop, rather than a generic
 * spinner — so a wait on this site still reads as this site's, not a
 * stock component.
 */
export function LoadingSpinner({ size = 40, label = "Loading", className }: LoadingSpinnerProps) {
  return (
    <div role="status" className={cn("inline-block", className)}>
      <TearHalo size={size} shiny strokeW={1.6} fast />
      <span className="sr-only">{label}</span>
    </div>
  );
}

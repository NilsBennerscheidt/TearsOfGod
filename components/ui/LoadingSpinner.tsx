import { TearHalo } from "@/components/brand/TearHalo";
import { cn } from "@/lib/cn";

interface LoadingSpinnerProps {
  size?: number;
  /** Accessible label — the only text a screen reader gets, since the mark itself is aria-hidden. */
  label?: string;
  /**
   * `"fast"` (default): the brand mark's own ring/rays sped up via
   * TearHalo's `fast` prop — a tight, constant spin for short waits.
   * `"cycle"`: spin → held rest → repeat (see `.tog-loader-cycle` in
   * globals.css) — reads as "still working"
   * across a longer wait without turning into ambient wallpaper, which a
   * bare constant spin does past a few seconds. The ambient ring/rays
   * keep spinning underneath at their normal (non-`fast`) speed rather
   * than competing with the cycle's own rotation.
   */
  variant?: "fast" | "cycle";
  className?: string;
}

/**
 * The brand mark (ring + rays + mask, see TearHalo), animated into a
 * loading indicator — so a wait on this site still reads as this site's,
 * not a stock spinner.
 */
export function LoadingSpinner({ size = 40, label = "Loading", variant = "fast", className }: LoadingSpinnerProps) {
  return (
    <div role="status" className={cn("inline-block", variant === "cycle" && "tog-loader-cycle", className)}>
      <TearHalo size={size} shiny strokeW={1.6} fast={variant === "fast"} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

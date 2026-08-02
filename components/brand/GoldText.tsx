import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface GoldTextProps {
  children: ReactNode;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
  /** Adds the drop-shadow glow (see .tog-gold-glow in globals.css) on top of the shimmer. */
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Text filled with the animated gold-foil shimmer (background-clip: text). Respects prefers-reduced-motion — see globals.css. */
export function GoldText({ children, as: Comp = "span", glow = false, className, style }: GoldTextProps) {
  return (
    <Comp className={cn("tog-gold-text", glow && "tog-gold-glow", className)} style={style}>
      {children}
    </Comp>
  );
}

interface GoldBarProps {
  children?: ReactNode;
  /** Adds the box-shadow glow (see .tog-gold-glow-box in globals.css) around the surface. */
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** A solid surface filled with the animated gold-foil shimmer. */
export function GoldBar({ children, glow = false, className, style }: GoldBarProps) {
  return (
    <div className={cn("tog-gold-foil", glow && "tog-gold-glow-box", className)} style={style}>
      {children}
    </div>
  );
}

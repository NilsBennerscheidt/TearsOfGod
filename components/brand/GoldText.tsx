import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface GoldTextProps {
  children: ReactNode;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
  className?: string;
  style?: CSSProperties;
}

/** Text filled with the animated gold-foil shimmer (background-clip: text). Respects prefers-reduced-motion — see globals.css. */
export function GoldText({ children, as: Comp = "span", className, style }: GoldTextProps) {
  return (
    <Comp className={cn("tog-gold-text", className)} style={style}>
      {children}
    </Comp>
  );
}

interface GoldBarProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** A solid surface filled with the animated gold-foil shimmer. */
export function GoldBar({ children, className, style }: GoldBarProps) {
  return (
    <div className={cn("tog-gold-foil", className)} style={style}>
      {children}
    </div>
  );
}

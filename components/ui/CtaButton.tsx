import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CtaButtonProps {
  href?: string;
  variant?: "solid" | "outline";
  /** Renders as a non-interactive placeholder instead of a link — for CTAs with no real destination yet (e.g. no streaming links exist). Never fabricate a href to avoid this state. */
  disabledLabel?: string;
  /** Forces a download instead of navigation — for file assets like the press-kit ZIP. `true` uses the server's filename; a string overrides it. */
  download?: boolean | string;
  className?: string;
  children: ReactNode;
}

/** A real <a>, never a styled <div> — see the mockup's original buttons, which weren't focusable or activatable by keyboard. */
export function CtaButton({ href, variant = "solid", disabledLabel, download, className, children }: CtaButtonProps) {
  // min-h-11 (44px) — these are the hero's primary actions and the most
  // likely thing tapped on a phone.
  const base = "font-display inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-xs tracking-wide uppercase";
  const styles =
    variant === "solid"
      ? "tog-gold-sheen tog-gold-cta bg-gold text-pitch hover:bg-gold-hi"
      : "border border-bone text-bone hover:border-gold hover:text-gold";

  if (!href) {
    return (
      <span className={cn(base, styles, "cursor-not-allowed opacity-50", className)} aria-disabled="true">
        {children}
        {disabledLabel && <span className="text-[0.6em] tracking-wide normal-case opacity-80">({disabledLabel})</span>}
      </span>
    );
  }

  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      className={cn(base, styles, className)}
      {...(download !== undefined ? { download } : {})}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

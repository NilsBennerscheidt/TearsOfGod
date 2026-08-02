import type { ReactNode } from "react";
import { GoldText } from "@/components/brand/GoldText";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  /** Optional line rendered below the title — e.g. TourHeader's computed date range. */
  children?: ReactNode;
}

/**
 * The eyebrow-over-huge-title pattern shared by every top-level page
 * (Tour, Media, News, We) — extracted out of TourHeader, the first page
 * to need it, once a second and third page needed the identical wrapper.
 *
 * GoldText (not a flat `text-gold`) — its animated gradient sweep is what
 * actually reads as "shimmer"; a flat fill with only the glow filter on
 * top just glints in place without any traveling highlight.
 */
export function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <div className="gutter-x border-b border-gold py-8 md:py-10">
      <p className="text-meta text-blood-text font-mono tracking-widest uppercase">{eyebrow}</p>
      <GoldText as="h1" glow className="text-tour-h1 font-display mt-1 leading-none uppercase">
        {title}
      </GoldText>
      {children}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Fades + gently rises each route's content into view on navigation.
 * `key={pathname}` is the whole trick: it makes React unmount/remount the
 * wrapper (rather than diff it) whenever the route changes, which
 * restarts the CSS animation for free — no router-event listener needed.
 * See .tog-page-enter in globals.css (disabled under prefers-reduced-motion
 * there).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="tog-page-enter">
      {children}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useFocusTrap } from "@/lib/focus-trap";
import { useNavItems } from "./nav-items";

/**
 * Hamburger disclosure for small viewports. Self-sufficient (owns its own
 * translations + route list via useNavItems) so it can sit as a plain
 * sibling of SiteNav in Header — Header places it in the grid's rightmost
 * column on mobile (`col-start-3 justify-self-end` below), independent of
 * where it falls in DOM/flex order on desktop.
 *
 * The panel is `absolute top-full` *inside* Header (which is `relative`),
 * so it always drops directly below the header bar with no measurement.
 * There's no dedicated close button in the panel — the trigger button
 * itself is that control: its label flips between "Menu" and "Close"
 * (via `aria-expanded` for assistive tech, and the visible text below)
 * while staying in the same top-right spot, so closing doesn't require
 * reaching into the panel. Esc, a backdrop click, and navigating away all
 * close it too.
 *
 * Focus trap (open/close lifecycle: focus moves into the panel, Tab
 * cycles within it, Esc closes, closing restores focus to the toggle
 * button) comes from the shared useFocusTrap hook — see lib/focus-trap.ts,
 * also used by PhotoLightbox. Navigating away closes the panel via the
 * pathname-change check below, independent of the trap itself.
 */
export function MobileNavToggle() {
  const t = useTranslations("Nav");
  const items = useNavItems();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  // Route changed while the panel was open (e.g. a link was activated by
  // something other than the onClick handler below) — close it. Adjusting
  // state during render (React's documented pattern for "reset state when
  // a prop changes") rather than in an effect — setState in an effect
  // body causes an extra cascading render.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  useFocusTrap(isOpen, panelRef, () => setIsOpen(false));

  return (
    <div className="col-start-3 justify-self-end md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((v) => !v)}
        className="border-gold text-bone border px-3 py-2 font-mono text-xs tracking-wide uppercase"
      >
        {isOpen ? t("close") : t("menu")}
      </button>

      {isOpen && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-full z-40 h-screen bg-pitch/80"
            onClick={() => setIsOpen(false)}
          />
          <div
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("menu")}
            className="absolute inset-x-0 top-full z-50 flex flex-col gap-6 border-b border-gold bg-pitch p-6"
          >
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className="font-display text-2xl uppercase"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

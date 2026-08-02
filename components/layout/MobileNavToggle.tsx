"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useNavItems } from "./nav-items";

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hamburger disclosure for small viewports. Self-sufficient (owns its own
 * translations + route list via useNavItems) so it can sit as a plain
 * sibling of SiteNav in Header rather than nested inside it — that's what
 * lets it render first in DOM/flex order and land hard-left in the mobile
 * header instead of stranded as the middle child of a justify-between row.
 *
 * The panel is `absolute top-full` *inside* Header (which is `relative`),
 * so it always drops directly below the header bar with no measurement —
 * previously `fixed inset-x-0 top-0` covered the header itself and gave
 * no way to tell the panel was open other than the button's label
 * flipping to "Close". A dedicated close button in the panel now owns
 * that job explicitly.
 *
 * Hand-rolled focus trap (no library allowed by the project's dependency
 * list) — see the effect below for the open/close lifecycle: focus moves
 * into the panel, Tab cycles within it, Esc closes, closing restores
 * focus to the toggle button, and navigating away closes it automatically.
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

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key !== "Tab" || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((v) => !v)}
        className="border-gold text-bone border px-3 py-2 font-mono text-xs tracking-wide uppercase"
      >
        {t("menu")}
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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="border-gold text-bone border px-3 py-2 font-mono text-xs tracking-wide uppercase"
              >
                {t("close")}
              </button>
            </div>
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

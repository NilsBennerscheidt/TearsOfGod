"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";

export interface NavItem {
  href: "/" | "/tour";
  label: string;
  active: boolean;
}

interface MobileNavToggleProps {
  items: NavItem[];
  menuLabel: string;
  closeLabel: string;
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hamburger disclosure for small viewports. Hand-rolled focus trap (no
 * library allowed by the project's dependency list) — see the effect
 * below for the open/close lifecycle: focus moves into the panel, Tab
 * cycles within it, Esc closes, closing restores focus to the toggle
 * button, and navigating away closes it automatically.
 */
export function MobileNavToggle({ items, menuLabel, closeLabel }: MobileNavToggleProps) {
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
        {isOpen ? closeLabel : menuLabel}
      </button>

      {isOpen && (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-40 bg-pitch/80" onClick={() => setIsOpen(false)} />
          <div
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={menuLabel}
            className="fixed inset-x-0 top-0 z-50 flex flex-col gap-4 border-b border-gold bg-pitch p-6"
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

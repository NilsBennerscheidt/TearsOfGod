"use client";

import { useEffect, useRef, type RefObject } from "react";

export const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hand-rolled focus trap (no library allowed by the project's dependency
 * list) shared by MobileNavToggle's disclosure panel and PhotoLightbox's
 * dialog — one implementation instead of two independently drifting
 * copies. Same lifecycle either place: focus moves into the container,
 * Tab cycles within it, Escape calls `onClose`, closing restores focus to
 * whatever had it before, and body scroll locks while open.
 *
 * `onClose` is read through a ref rather than listed as an effect
 * dependency — callers pass an inline closure, and putting that in the
 * dependency array would tear down and rebuild the listener (re-focusing
 * the first element, re-locking scroll) on every render that creates a
 * new closure, not just on open/close.
 *
 * Tab-cycling alone only stops focus from *leaving* the container via the
 * keyboard — it does nothing for a screen reader's virtual cursor (swipe
 * navigation, the rotor, "read from here"), which doesn't go through Tab
 * at all and can still land on page content sitting behind an
 * `aria-modal="true"` dialog. `inert` on `#main-content` closes that gap:
 * it's skipped only when the trapped container is itself inside
 * `#main-content` (nothing to inert without also inerting the dialog) —
 * PhotoLightbox is portaled to `document.body` specifically so this
 * condition holds for it; MobileNavToggle's panel lives in Header,
 * already outside `#main-content`, so it holds there without a portal.
 */
export function useFocusTrap(
  isOpen: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const mainContent = document.getElementById("main-content");
    const shouldInertMain = !!mainContent && !mainContent.contains(containerRef.current);
    if (shouldInertMain) mainContent.setAttribute("inert", "");

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
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
      if (shouldInertMain) mainContent.removeAttribute("inert");
      previouslyFocused?.focus();
    };
  }, [isOpen, containerRef]);
}

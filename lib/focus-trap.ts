"use client";

import { useEffect, useRef, type RefObject } from "react";

export const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  /**
   * `true` (default) makes Escape call `onClose` — right for a dialog
   * that Escape is the natural way to dismiss. Pass `false` when the
   * trapped content already gives Escape its own meaning (a game where
   * Escape means "pause"), so the hook doesn't fire a second, competing
   * action on top of it. `onClose` becomes irrelevant when this is
   * `false` and can be omitted.
   */
  handleEscape?: boolean;
  /**
   * `"main"` (default, and every existing caller's behavior, unchanged)
   * inerts only `#main-content`. `"body"` inerts every *other* direct
   * child of `document.body` instead — for a trap whose container isn't
   * nested inside the page at all (a full-screen takeover sitting
   * alongside the header, not just above the main content), where
   * `#main-content` alone would leave the header still reachable by a
   * screen reader's virtual cursor even though it's entirely covered
   * on screen.
   */
  inertScope?: "main" | "body";
}

/**
 * Hand-rolled focus trap (no library allowed by the project's dependency
 * list) shared by MobileNavToggle's disclosure panel, PhotoLightbox's
 * dialog, and GameShell's full-screen game surface — one implementation
 * instead of three independently drifting copies. Same lifecycle every
 * place: focus moves into the container, Tab cycles within it, Escape
 * calls `onClose` (unless opted out — see `handleEscape`), closing
 * restores focus to whatever had it before, and body scroll locks while
 * open.
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
 * `aria-modal="true"` dialog. `inert` closes that gap — see `inertScope`
 * above for which elements it applies to. Either way it's skipped for an
 * element the trapped container is itself nested inside (nothing to
 * inert without also inerting the dialog) — PhotoLightbox and GameShell
 * are both portaled to `document.body` specifically so this condition
 * holds for them; MobileNavToggle's panel lives in Header, already
 * outside `#main-content`, so it holds there without a portal.
 */
export function useFocusTrap(
  isOpen: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose?: () => void,
  options: UseFocusTrapOptions = {},
) {
  const onCloseRef = useRef(onClose);
  const handleEscape = options.handleEscape ?? true;
  const inertScope = options.inertScope ?? "main";

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

    // Elements this trap inerts while open, and only the ones it set
    // itself (never an element that already had the attribute for some
    // other reason) — restored on close either way.
    const inerted: Element[] = [];
    if (inertScope === "main") {
      const mainContent = document.getElementById("main-content");
      if (mainContent && !mainContent.contains(containerRef.current) && !mainContent.hasAttribute("inert")) {
        mainContent.setAttribute("inert", "");
        inerted.push(mainContent);
      }
    } else {
      for (const child of document.body.children) {
        if (child === containerRef.current || child.contains(containerRef.current) || child.hasAttribute("inert")) {
          continue;
        }
        child.setAttribute("inert", "");
        inerted.push(child);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (handleEscape) onCloseRef.current?.();
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
      for (const element of inerted) element.removeAttribute("inert");
      previouslyFocused?.focus();
    };
  }, [isOpen, containerRef, handleEscape, inertScope]);
}

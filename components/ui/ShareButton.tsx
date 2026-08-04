"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface ShareButtonProps {
  title: string;
}

/**
 * `navigator.share` when available (mobile mostly, opens the OS share
 * sheet) — otherwise falls back to copying the current URL, with a
 * "Copied" state that resets after ~2s. Feature-detects both rather than
 * assuming either exists (Safari desktop has no `navigator.share`; some
 * embedded browsers lack the Clipboard API too — notably on any non-secure
 * origin, e.g. a plain-HTTP LAN address, where neither API exists at all).
 * In that last case a native `prompt()` pre-filled with the URL is the
 * fallback of last resort — no visual feedback beats silently doing
 * nothing when the click was clearly registered.
 *
 * Reads `window.location.href` inside the click handler rather than
 * taking a `url` prop — that's guaranteed to be the browser, so no SSR
 * guard is needed for it the way it would be at module/render scope.
 */
export function ShareButton({ title }: ShareButtonProps) {
  const t = useTranslations("News");
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleClick() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User dismissed the share sheet — not an error worth surfacing.
      }
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
      return;
    }

    // Neither API exists (typically a non-secure-context origin) —
    // still give the user something to act on instead of a dead click.
    window.prompt(t("shareUnavailable"), url);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="border-gold text-gold hover:text-gold-hi border px-3 py-1 font-mono text-xs tracking-wide uppercase"
    >
      {copied ? t("shareCopied") : t("share")}
    </button>
  );
}

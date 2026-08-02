"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

interface ShareButtonProps {
  title: string;
}

/**
 * `navigator.share` when available (mobile mostly, opens the OS share
 * sheet) — otherwise falls back to copying the current URL, with a
 * "Copied" state that resets after ~2s. Feature-detects both rather than
 * assuming either exists (Safari desktop has no `navigator.share`; some
 * embedded browsers lack the Clipboard API too). Reads
 * `window.location.href` inside the click handler rather than taking a
 * `url` prop — that's guaranteed to be the browser, so no SSR guard is
 * needed for it the way it would be at module/render scope.
 */
export function ShareButton({ title }: ShareButtonProps) {
  const t = useTranslations("News");
  const [copied, setCopied] = useState(false);

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
      setTimeout(() => setCopied(false), 2000);
    }
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

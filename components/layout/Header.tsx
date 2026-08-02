import { Wordmark } from "@/components/brand/Wordmark";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNavToggle } from "./MobileNavToggle";
import { SiteNav } from "./SiteNav";

/**
 * Server Component — identical across every page, so it lives in the
 * root layout rather than being re-declared per page. `relative` gives
 * MobileNavToggle's panel/scrim (`absolute top-full`) a containing block,
 * so they always drop directly below the bar regardless of header height.
 *
 * MobileNavToggle is deliberately the first child, not nested inside
 * SiteNav: under `justify-between`, the first flex item lands hard-left.
 * Previously the toggle lived inside SiteNav's wrapper, which put it in
 * the middle of the row on mobile (SiteNav's own <ul> was hidden, but its
 * <nav> wrapper — and the toggle inside it — was not).
 */
export function Header({ locale }: { locale: AppLocale }) {
  return (
    <header className="gutter-x tog-gold-glow-box relative flex items-center justify-between gap-4 border-b border-gold py-4">
      <MobileNavToggle />
      {/* No aria-label here — the link's accessible name is inherited from Wordmark's own role="img" aria-label, which is correct and sufficient. `shiny` fills it with the animated gold-foil gradient (already built, previously unused by any real page) instead of a flat color, so the mark itself sweeps — tog-gold-glow adds the shimmering aura on top. */}
      <Link href="/">
        <Wordmark shiny width={110} className="tog-gold-glow" />
      </Link>
      <SiteNav />
      <div className="flex items-center gap-4">
        <span className="hidden font-mono text-xs tracking-wide text-steel-text md:inline">44575 · DE</span>
        <LocaleSwitcher currentLocale={locale} />
      </div>
    </header>
  );
}

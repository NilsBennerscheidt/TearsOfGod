import { SpinnableTearHalo } from "@/components/brand/SpinnableTearHalo";
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
 * Below `md` this is a 3-column grid (`1fr auto 1fr`), not the desktop
 * flex row — under `justify-between` the wordmark is only visually
 * centred when the two outer clusters happen to be equal width, which the
 * mobile toggle button and the mobile left cluster aren't. Grid centres
 * the middle column geometrically regardless.
 *
 * The mobile-left and desktop-right clusters are two separate elements,
 * each `hidden` on the breakpoint it doesn't apply to — not one element
 * repositioned, because the two clusters hold different content (mobile:
 * spin logo + locale switcher; desktop: coordinates + locale switcher)
 * and sit on opposite sides of the bar. `display:none` fully removes the
 * hidden one from layout (grid placement *and* flex flow), so it never
 * costs a cell or an empty flex-gap slot on the breakpoint it's absent
 * from. LocaleSwitcher itself is a stateless server component (a plain
 * Link), so rendering it twice is free — only one copy is ever in the
 * accessibility tree at a time.
 */
export function Header({ locale }: { locale: AppLocale }) {
  return (
    <header className="gutter-x tog-gold-glow-box relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-gold py-4 md:flex md:justify-between">
      <div className="col-start-1 flex items-center gap-3 justify-self-start md:hidden">
        <SpinnableTearHalo size={34} strokeW={2.4} />
        <LocaleSwitcher currentLocale={locale} />
      </div>
      {/* No aria-label here — the link's accessible name is inherited from Wordmark's own role="img" aria-label, which is correct and sufficient. `shiny` fills it with the animated gold-foil gradient (already built, previously unused by any real page) instead of a flat color, so the mark itself sweeps — tog-gold-glow adds the shimmering aura on top. */}
      <Link href="/" className="col-start-2 justify-self-center">
        <Wordmark shiny width={110} className="tog-gold-glow" />
      </Link>
      <SiteNav />
      <MobileNavToggle />
      <div className="hidden items-center gap-4 md:flex">
        <span className="font-mono text-xs tracking-wide text-steel-text">44575 · DE</span>
        <LocaleSwitcher currentLocale={locale} />
      </div>
    </header>
  );
}

import { Wordmark } from "@/components/brand/Wordmark";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SiteNav } from "./SiteNav";

/**
 * Server Component — identical across every page, so it lives in the
 * root layout rather than being re-declared per page.
 */
export function Header({ locale }: { locale: AppLocale }) {
  return (
    <header className="gutter-x flex items-center justify-between gap-4 border-b border-gold py-4">
      {/* No aria-label here — the link's accessible name is inherited from Wordmark's own role="img" aria-label, which is correct and sufficient. */}
      <Link href="/">
        <Wordmark color="var(--color-gold)" width={110} />
      </Link>
      <SiteNav />
      <div className="flex items-center gap-4">
        <span className="hidden font-mono text-xs tracking-wide text-steel-text md:inline">44575 · DE</span>
        <LocaleSwitcher currentLocale={locale} />
      </div>
    </header>
  );
}

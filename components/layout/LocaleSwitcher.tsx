import { Link } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

const LOCALE_LABELS: Record<AppLocale, string> = { de: "DE", en: "EN" };

/**
 * Server Component by design — a 3rd interactive nav component (beyond
 * SiteNav/MobileNavToggle) would exceed the project's 4-client-component
 * budget, and doesn't need client JS anyway: `next-intl`'s Link renders
 * a locale-swapped href without hooks.
 *
 * Simplification: always links to the other locale's homepage, not "this
 * same page in the other language" (which would need the current
 * pathname — via headers() server-side, or usePathname() client-side,
 * either more machinery than a 2-route site currently justifies). Revisit
 * if/when precise same-page switching earns its cost.
 */
export function LocaleSwitcher({ currentLocale }: { currentLocale: AppLocale }) {
  const other = routing.locales.find((locale) => locale !== currentLocale);
  if (!other) return null;

  return (
    <Link
      href="/"
      locale={other}
      hrefLang={other}
      className="text-steel-text hover:text-bone font-mono text-xs tracking-wide uppercase"
    >
      {LOCALE_LABELS[other]}
    </Link>
  );
}

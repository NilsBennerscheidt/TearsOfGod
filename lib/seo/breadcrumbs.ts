import type { AppLocale } from "@/i18n/routing";
import { absoluteUrl } from "./site";

export interface Crumb {
  name: string;
  /** Route path without the locale prefix, e.g. "/news". */
  path: string;
}

/**
 * BreadcrumbList for a subpage, always rooted at the locale's landing
 * page.
 *
 * The site has no visual breadcrumb trail, and this deliberately doesn't
 * add one — the markup describes a hierarchy that genuinely exists in the
 * URLs (/de → /de/news → /de/news/<slug>) and is what lets a result show
 * "tearsofgod.net › News" instead of a bare URL.
 */
export function breadcrumbJsonLd(locale: AppLocale, homeName: string, crumbs: Crumb[]) {
  const items = [{ name: homeName, path: "" }, ...crumbs];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(`/${locale}${crumb.path}`),
    })),
  };
}

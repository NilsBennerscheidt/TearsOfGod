"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

/**
 * Single source of truth for the site's primary routes, shared by SiteNav
 * (desktop <ul>) and MobileNavToggle (mobile disclosure panel) so both
 * navs always list the same routes, in the same order, with identical
 * active-state logic — previously MobileNavToggle received this list as
 * props from SiteNav, which forced the mobile panel to be a DOM child of
 * the desktop nav even though the two are visually siblings in the
 * header. `typedRoutes: true` (next.config.ts) validates each href
 * against the App Router's real route tree at build time.
 */
export const NAV_ROUTES = ["/", "/tour", "/media", "/news", "/band"] as const;
export type NavRoute = (typeof NAV_ROUTES)[number];

const LABEL_KEYS: Record<NavRoute, string> = {
  "/": "home",
  "/tour": "tour",
  "/media": "media",
  "/news": "news",
  "/band": "band",
};

export interface NavItem {
  href: NavRoute;
  label: string;
  active: boolean;
}

export function useNavItems(): NavItem[] {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return NAV_ROUTES.map((href) => ({
    href,
    label: t(LABEL_KEYS[href]),
    active: pathname === href,
  }));
}

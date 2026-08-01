"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { type NavItem, MobileNavToggle } from "./MobileNavToggle";

const ROUTES = ["/", "/tour"] as const;

/**
 * Client Component: needs usePathname() for active-route state and owns
 * the mobile disclosure. Route list is intentionally just these two —
 * Music/Band/Contact are cut from v1, so the nav must not link to them.
 */
export function SiteNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  const items: NavItem[] = ROUTES.map((href) => ({
    href,
    label: t(href === "/" ? "home" : "tour"),
    active: pathname === href,
  }));

  return (
    <nav aria-label={t("menu")}>
      <ul className="hidden gap-6 font-mono text-xs tracking-wide uppercase md:flex">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={
                item.active
                  ? "border-b-2 border-gold pb-0.5 text-gold"
                  : "text-bone hover:text-gold"
              }
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <MobileNavToggle items={items} menuLabel={t("menu")} closeLabel={t("close")} />
    </nav>
  );
}

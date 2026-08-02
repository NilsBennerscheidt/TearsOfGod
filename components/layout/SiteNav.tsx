"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useNavItems } from "./nav-items";

/**
 * Desktop route list. Client Component: needs usePathname() (via
 * useNavItems) for active-route state. The mobile equivalent is
 * MobileNavToggle — a sibling in Header, not a child of this nav; see
 * Header.tsx for why the two are split rather than nested.
 */
export function SiteNav() {
  const t = useTranslations("Nav");
  const items = useNavItems();

  return (
    <nav aria-label={t("menu")} className="hidden md:block">
      <ul className="flex gap-6 font-mono text-xs tracking-wide uppercase">
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
    </nav>
  );
}

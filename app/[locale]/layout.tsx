import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Tears of God",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for this request — see
  // https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations("Nav");

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/*
            Minimal skip-link for Stage 1. The full focus-visible ring
            system (site-wide, gold, 2px offset) is Stage 3 shell work —
            this only needs to be usable on its own before then.
          */}
          <a
            href="#main-content"
            className="focus:bg-gold focus:text-pitch focus:font-display sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2"
          >
            {t("skipToContent")}
          </a>
          <main id="main-content">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

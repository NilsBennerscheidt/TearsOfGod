import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Grain } from "@/components/brand/Grain";
import { GoldFoilDefs } from "@/components/brand/GoldFoilDefs";
import { Header } from "@/components/layout/Header";
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
          <GoldFoilDefs />
          {/* One fixed, whole-viewport texture layer — not per-section like the mockup's per-artboard <Grain>. Low z-index and pointer-events:none so it never sits above or blocks real content. */}
          <Grain className="fixed z-0" />
          <a
            href="#main-content"
            className="focus:bg-gold focus:text-pitch focus:font-display sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2"
          >
            {t("skipToContent")}
          </a>
          <Header locale={locale} />
          <main id="main-content">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

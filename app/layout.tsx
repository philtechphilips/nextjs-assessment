import type { Metadata } from "next";
import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { LanguageToggle } from "@/lib/i18n/language-toggle";
import { getI18n } from "@/lib/i18n/server";
import { QueryProvider } from "@/lib/query/query-provider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("companies.title") };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { locale, messages } = await getI18n();

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          <QueryProvider>
            <header className="flex justify-end border-b border-slate-200 px-6 py-2">
              <LanguageToggle />
            </header>
            <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

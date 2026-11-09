import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BuildingIcon } from "@/components/icons";
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
            <header className="border-b border-slate-200 bg-white">
              <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <BuildingIcon className="size-5" />
                </span>
                <LanguageToggle />
              </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
              {children}
            </main>
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

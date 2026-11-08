"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Messages } from "./messages/en";
import {
  createDateFormatter,
  createTranslator,
  type Translate,
} from "./translate";

type I18n = {
  locale: Locale;
  t: Translate;
  formatDate: (isoDate: string) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      t: createTranslator(messages),
      formatDate: createDateFormatter(locale),
    }),
    [locale, messages],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18n {
  const i18n = use(I18nContext);
  if (!i18n) throw new Error("useI18n must be used inside I18nProvider");
  return i18n;
}

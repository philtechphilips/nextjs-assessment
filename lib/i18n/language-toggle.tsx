"use client";

import { startTransition } from "react";
import { setLocale } from "./actions";
import { LOCALES } from "./config";
import { useI18n } from "./i18n-provider";

export function LanguageToggle() {
  const { locale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className="inline-flex gap-0.5 rounded-lg bg-slate-100 p-0.5"
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={option === locale}
          onClick={() => startTransition(() => setLocale(option))}
          className="rounded-md px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 aria-pressed:bg-white aria-pressed:text-slate-900 aria-pressed:shadow-xs"
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

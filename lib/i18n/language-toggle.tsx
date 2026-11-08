"use client";

import { startTransition } from "react";
import { setLocale } from "./actions";
import { LOCALES } from "./config";
import { useI18n } from "./i18n-provider";

export function LanguageToggle() {
  const { locale, t } = useI18n();

  return (
    <div role="group" aria-label={t("language.label")} className="flex gap-1">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={option === locale}
          onClick={() => startTransition(() => setLocale(option))}
          className="rounded px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 aria-pressed:bg-slate-900 aria-pressed:text-white"
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

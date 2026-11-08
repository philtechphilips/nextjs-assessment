import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import type { Messages } from "./messages/en";
import { createTranslator } from "./translate";

// Only this server module imports the dictionaries. Client components receive
// the active one as a prop from the root layout, so one language is shipped.
const loaders: Record<Locale, () => Promise<Messages>> = {
  en: () => import("./messages/en").then((module) => module.en),
  nl: () => import("./messages/nl").then((module) => module.nl),
};

export async function getI18n() {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stored) ? stored : DEFAULT_LOCALE;
  const messages = await loaders[locale]();
  return { locale, messages, t: createTranslator(messages) };
}

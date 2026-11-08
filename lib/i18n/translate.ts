import type { Locale } from "./config";
import type { MessageKey, Messages } from "./messages/en";

export type Translate = (
  key: MessageKey,
  values?: Record<string, string | number>,
) => string;

export function createTranslator(messages: Messages): Translate {
  return (key, values) =>
    messages[key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
      String(values?.[name] ?? placeholder),
    );
}

export function createDateFormatter(locale: Locale) {
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return (isoDate: string) => formatter.format(new Date(isoDate));
}

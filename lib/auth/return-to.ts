const FALLBACK = "/companies";
const PLACEHOLDER_ORIGIN = "https://app.invalid";

/** Only same-origin paths are accepted, so returnTo cannot be an open redirect. */
export function safeReturnTo(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/")) return FALLBACK;
  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return FALLBACK;
    return url.pathname + url.search;
  } catch {
    return FALLBACK;
  }
}

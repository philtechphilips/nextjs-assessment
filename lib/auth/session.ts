// Fake sign-in. A hosted identity provider's SDK would replace this module;
// everything else only depends on getAccessToken and expireSession.

const TOKEN_KEY = "access_token";

export function getAccessToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function signIn(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Drops the token and leaves with a full page load rather than a client
 * navigation, so no cached tenant data survives into the next session.
 */
export function expireSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  const returnTo = window.location.pathname + window.location.search;
  window.location.replace(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
}

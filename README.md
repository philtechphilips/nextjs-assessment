# Companies

A small "Companies" feature built for the Next.js assessment: a filterable list with a detail drawer, against an in-memory API.

## Running it

Requires Node 20.9+ and pnpm.

```sh
pnpm install
pnpm dev        # http://localhost:3000, then press "Sign in"
```

| Check | Command |
| --- | --- |
| Lint | `pnpm lint` |
| Types | `pnpm typecheck` |
| Unit and component tests | `pnpm test` |
| Production build | `pnpm build` |

The data lives in memory and resets when the server restarts.

### Trying the harder paths

- **409 conflict:** open the same company in two tabs. Save a change in one, then save in the other.
- **401:** run `localStorage.removeItem("access_token")` in the console, then change a filter. You land on sign-in and return to the same URL afterwards.
- **422 from the API:** the client rules mirror the API's, so the UI cannot trigger this by itself. It is covered by component tests. To see it live, temporarily make `validateDraft` return `{}` and save an empty name.
- **Shared link:** copy a URL while the drawer is open and open it in a new tab.

## Layout

```
app/                  Routes. Server Components by default, plus the API route handlers
features/companies/   The feature: URL state, table, drawer, forms
components/           Generic UI: Button, Drawer, RetryableError
lib/api/              Typed client: schema.ts stands in for generated code
lib/auth/             Fake session, safe returnTo
lib/i18n/             Locale cookie, dictionaries, translator
lib/query/            QueryClient setup, central 401 handling
lib/fake-api/         The "backend" behind the route handlers
test/                 Test setup and helpers
```

`lib/fake-api` is treated as a separate system: the only thing it shares with the frontend is the contract in `schema.ts`.

## Decisions and why

**The URL is the only copy of the list state.** Filters, sort, page and the open company are parsed from the URL by one pure function, and the query key is derived from the result, so there is nothing to keep in sync. Invalid values fall back to defaults, and defaults are left out of the URL so each state has one address. The search box is the one exception: it holds its text locally for the 300 ms debounce.

**`history.pushState` instead of `router.push`.** Next.js keeps `useSearchParams` in sync with the native history API, and this avoids a server round trip for every filter change on a page whose data is fetched on the client. Discrete changes push an entry. Search pushes once and then replaces, so Back leaves the search rather than undoing each pause in typing.

**The table stays mounted.** `keepPreviousData` holds the current rows, dimmed, while the next result loads. Loading, error and empty are rows inside the same `<table>`. I used `useQuery` rather than `useSuspenseQuery` because a Suspense fallback would replace the table on every filter change.

**The drawer is a search param, not an intercepting route.** `?company=<id>` keeps the list and drawer on one URL, costs no server navigation, and a shared link needs no second page. An intercepting route would earn its complexity if the detail were also a standalone page, which the brief does not ask for.

**Native `<dialog>` for the drawer.** `showModal()` provides the focus trap (the rest of the page becomes inert), Escape, top-layer rendering and focus restoration, with no dependency and no hand-written trap to get wrong. Tab can reach the browser's own UI, as with any native modal, but never the page behind it.

**Edit form: a snapshot plus a three-way merge.** The form copies the record once when it opens and is deliberately not synced with the query, because `if_version` has to be the version the user actually saw. If a background refetch could update it, the concurrency check would silently become last-write-wins.

On a 409 the draft is kept and saving is blocked until the user loads the latest version. Fields they did not touch then take the new value, fields they did touch keep their text, and where both sides changed a field the other person's value is shown beneath it. The next save carries the new version.

**No optimistic updates.** A write can legitimately be rejected here, and showing a success that then reverts is worse than waiting 300 to 800 ms. It also means a 409 has nothing to roll back: the cache is only invalidated. A successful PATCH writes the response straight into the detail cache and invalidates the lists.

**The detail query has `gcTime: 0`.** Since the form seeds itself once, it should not open on a copy already known to be old. Dropping the entry when the drawer closes avoids needless 409s at the cost of one GET per open.

**A 401 leaves with a full page load.** One handler on the `QueryCache` and `MutationCache` covers every request. The hard navigation also guarantees that no tenant data survives in memory, without having to coordinate clearing a cache that mounted components are still observing.

**Token in `localStorage`, behind one module.** That is a concession to the fake sign-in, because it makes shared links work across tabs. A real IdP SDK would replace `lib/auth/session.ts`; the client only calls `getAccessToken()`, per request.

**Hand-written i18n, about 100 lines.** The locale is a cookie read in the root layout, so `<html lang>` and server text are right on the first byte. Dictionaries are imported only by a server module and the active one is passed to a client provider, so one language ships. `nl` is typed as `Record<MessageKey, string>`, so a missing translation is a compile error. For a handful of strings I preferred this to adding a plugin and config. See below for when I would change that.

**`cacheComponents` is turned off.** create-next-app enables it, but with it a cookie read in the root layout is a build error, since `<html>` has no parent to wrap in `<Suspense>`. Everything here is per-user and fetched on the client, so there is nothing for it to cache. The docs say the option goes away in the next major version, at which point the locale needs to move to a `[lang]` segment or a pre-paint script.

**The fake API behaves like FastAPI where it matters.** 422s use the `{ detail: [{ loc, msg, type }] }` shape, and body validation runs before the 404 and 409 checks, because that is the order FastAPI would apply them. The store is on `globalThis` because the two route files can be bundled separately, and a module-level array could exist once per route.

**No form library or schema validator.** Three fields and one rule do not need them. Errors are derived from the draft and the mutation state rather than stored, so there is no error state to fall out of sync.

**Tests fake only the network and `next/navigation`.** Component tests use the real client, a real `QueryClient` and MSW, so they break when behaviour breaks rather than when internals move.

## With more time

- Replace the fake session with silent token refresh: one shared refresh, and a replay of the failed request, so a token expiring mid-edit does not cost the user their draft.
- Warn before closing a drawer with unsaved changes.
- Move to next-intl once plurals or real translation volume appear, and use `Accept-Language` for the first visit.
- Add a "use this value" action next to each conflicting field.
- Prefetch the first page of the list on the server and hydrate it, which needs a server-side token source.

## Consciously left out

- **Click outside to close.** Not requested, and an easy way to lose a draft.
- **Sign-out.** Not requested. Clear the token in the console to test it.
- **`loading.tsx`.** The page awaits no server data, so it would never be seen. `app/companies/error.tsx` exists only for render errors; query errors are handled inline.
- **Domain format validation.** The API has no such rule, and the client mirrors the API.
- **Pixel-level polish** and a design system.

## Known edge cases I did not handle

- A 401 while editing sends the user to sign-in and the draft is lost. This is the main reason for the refresh work above.
- Pressing Back within the 300 ms search debounce can re-apply the term that was pending.
- After a successful Retry, the button disappears and focus falls back to the page.
- If saving reorders the list, the row that opened the drawer may be gone, and focus then goes to the page.
- The language toggle cannot be reached while the drawer is open, since the page behind a modal is inert.
- Each server process has its own in-memory store, so the API only behaves correctly on a single instance.
- If records change between page requests, offset pagination can repeat or skip a row.

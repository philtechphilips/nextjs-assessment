import { useMemo, useSyncExternalStore } from "react";

// A stand-in for next/navigation's useSearchParams: like the real hook, it
// follows pushState, replaceState and the browser's back and forward.

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

for (const method of ["pushState", "replaceState"] as const) {
  const original = window.history[method].bind(window.history);
  window.history[method] = (...args: Parameters<History["pushState"]>) => {
    original(...args);
    notify();
  };
}
window.addEventListener("popstate", notify);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, () => window.location.search);
  return useMemo(() => new URLSearchParams(search), [search]);
}

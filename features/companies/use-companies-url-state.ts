"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  parseCompaniesUrl,
  serializeCompaniesUrl,
  type CompaniesUrlState,
} from "./url-state";

type HistoryMode = "push" | "replace";

export function useCompaniesUrlState() {
  const searchParams = useSearchParams();
  const state = useMemo(() => parseCompaniesUrl(searchParams), [searchParams]);

  // Uses the native history API, which Next.js keeps in sync with
  // useSearchParams, so changing a filter costs no server round trip.
  // Reads the live URL so a delayed call (the search debounce) cannot apply a
  // change on top of an outdated state.
  const updateUrl = useCallback(
    (patch: Partial<CompaniesUrlState>, mode: HistoryMode = "push") => {
      const current = parseCompaniesUrl(
        new URLSearchParams(window.location.search),
      );
      const search = serializeCompaniesUrl({ ...current, ...patch });
      const url = search ? `?${search}` : window.location.pathname;
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [],
  );

  const companyHref = useCallback(
    (company: string) => `?${serializeCompaniesUrl({ ...state, company })}`,
    [state],
  );

  return { state, updateUrl, companyHref };
}

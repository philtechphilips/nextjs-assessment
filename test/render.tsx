import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import type { Company } from "@/lib/api/schema";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { en } from "@/lib/i18n/messages/en";
import { createQueryClient } from "@/lib/query/client";

export function renderWithProviders(ui: ReactElement) {
  const onUnauthorized = vi.fn();
  const queryClient = createQueryClient(onUnauthorized);
  // Keeps the retry path instant; production retry rules have their own test.
  queryClient.setDefaultOptions({ queries: { retry: false } });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale="en" messages={en}>
        {ui}
      </I18nProvider>
    </QueryClientProvider>,
  );
  return { ...result, onUnauthorized, queryClient };
}

export function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "company-1",
    name: "Acme",
    domain: "acme.example",
    status: "new",
    version: 1,
    created_at: "2026-01-15T10:00:00.000Z",
    updated_at: "2026-01-15T10:00:00.000Z",
    ...overrides,
  };
}

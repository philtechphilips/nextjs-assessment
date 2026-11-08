"use client";

import { CompaniesTable } from "./companies-table";
import { CompaniesToolbar } from "./companies-toolbar";
import { CompanyDrawer } from "./company-drawer";
import { useCompaniesUrlState } from "./use-companies-url-state";
import { NEW_COMPANY } from "./url-state";

export function CompaniesScreen() {
  const { state, updateUrl, companyHref } = useCompaniesUrlState();

  return (
    <>
      <CompaniesToolbar
        q={state.q}
        status={state.status}
        // Starting a search adds one history entry; refining it replaces that
        // entry, so Back leaves the search instead of undoing each pause.
        onSearch={(q) => updateUrl({ q, page: 1 }, state.q ? "replace" : "push")}
        onStatusChange={(status) => updateUrl({ status, page: 1 })}
        onCreate={() => updateUrl({ company: NEW_COMPANY })}
      />

      <CompaniesTable
        state={state}
        companyHref={companyHref}
        onOpenCompany={(company) => updateUrl({ company })}
        onSortChange={(sort) => updateUrl({ sort, page: 1 })}
        onPageChange={(page) => updateUrl({ page })}
        onClearFilters={() => updateUrl({ q: "", status: null, page: 1 })}
      />

      {state.company && (
        <CompanyDrawer
          target={state.company}
          onClose={() => updateUrl({ company: null })}
          onCreated={(company) =>
            updateUrl({ company: company.id }, "replace")
          }
        />
      )}
    </>
  );
}

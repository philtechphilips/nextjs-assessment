import {
  COMPANY_SORTS,
  COMPANY_STATUSES,
  type CompanySort,
  type CompanyStatus,
  type ListCompaniesParams,
} from "@/lib/api/schema";

export const PAGE_SIZE = 20;
export const DEFAULT_SORT: CompanySort = "-created_at";
/** Value of the `company` param that opens the drawer in create mode. */
export const NEW_COMPANY = "new";

export type CompaniesUrlState = {
  q: string;
  status: CompanyStatus | null;
  sort: CompanySort;
  page: number;
  company: string | null;
};

type ReadableParams = Pick<URLSearchParams, "get">;

export function isCompanyStatus(value: unknown): value is CompanyStatus {
  return (COMPANY_STATUSES as readonly unknown[]).includes(value);
}

function isCompanySort(value: unknown): value is CompanySort {
  return (COMPANY_SORTS as readonly unknown[]).includes(value);
}

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** Anything invalid in a hand-edited or outdated link falls back to its default. */
export function parseCompaniesUrl(params: ReadableParams): CompaniesUrlState {
  const status = params.get("status");
  const sort = params.get("sort");
  return {
    q: params.get("q") ?? "",
    status: isCompanyStatus(status) ? status : null,
    sort: isCompanySort(sort) ? sort : DEFAULT_SORT,
    page: parsePage(params.get("page")),
    company: params.get("company") || null,
  };
}

/** Defaults are left out, so every state has exactly one URL. */
export function serializeCompaniesUrl(state: CompaniesUrlState): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.status) params.set("status", state.status);
  if (state.sort !== DEFAULT_SORT) params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  if (state.company) params.set("company", state.company);
  return params.toString();
}

export function toListParams({
  q,
  status,
  sort,
  page,
}: CompaniesUrlState): ListCompaniesParams {
  return {
    q,
    status: status ?? undefined,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
}

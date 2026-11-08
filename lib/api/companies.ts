import { queryOptions } from "@tanstack/react-query";
import { request } from "./http";
import type {
  Company,
  CompanyList,
  CreateCompanyBody,
  ListCompaniesParams,
  UpdateCompanyBody,
} from "./schema";

/** Equivalent params must produce the same query key and the same request. */
export function normalizeListParams({
  limit,
  offset,
  q,
  status,
  sort,
}: ListCompaniesParams): ListCompaniesParams {
  return { limit, offset, q: q?.trim() || undefined, status, sort };
}

export function listCompaniesPath(params: ListCompaniesParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeListParams(params))) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `/companies?${query}` : "/companies";
}

export function listCompanies(
  params: ListCompaniesParams,
  signal?: AbortSignal,
): Promise<CompanyList> {
  return request(listCompaniesPath(params), { signal });
}

export function getCompany(
  id: string,
  signal?: AbortSignal,
): Promise<Company> {
  return request(`/companies/${encodeURIComponent(id)}`, { signal });
}

export function createCompany(body: CreateCompanyBody): Promise<Company> {
  return request("/companies", { method: "POST", body });
}

export function updateCompany(
  id: string,
  body: UpdateCompanyBody,
): Promise<Company> {
  return request(`/companies/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}

export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  list: (params: ListCompaniesParams) =>
    [...companyKeys.lists(), normalizeListParams(params)] as const,
  detail: (id: string) => [...companyKeys.all, "detail", id] as const,
};

export function listCompaniesOptions(params: ListCompaniesParams) {
  return queryOptions({
    queryKey: companyKeys.list(params),
    queryFn: ({ signal }) => listCompanies(params, signal),
  });
}

export function getCompanyOptions(id: string) {
  return queryOptions({
    queryKey: companyKeys.detail(id),
    queryFn: ({ signal }) => getCompany(id, signal),
    // The edit form is seeded from this query once. Keeping nothing after the
    // drawer closes means a form never opens on a version it knows is old.
    staleTime: 0,
    gcTime: 0,
  });
}

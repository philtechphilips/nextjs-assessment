import type { Company, CompanyList, CompanySort } from "@/lib/api/schema";
import { seedCompanies } from "./seed";
import type { CreateInput, ListInput, UpdateInput } from "./validation";

// Each route file can be bundled separately, so a module-level array could
// exist once per route. globalThis gives them, and dev reloads, a single copy.
const globals = globalThis as typeof globalThis & {
  fakeCompanies?: Company[];
};

function companies(): Company[] {
  globals.fakeCompanies ??= seedCompanies();
  return globals.fakeCompanies;
}

function compare(a: Company, b: Company, sort: CompanySort): number {
  const descending = sort.startsWith("-");
  const field = descending ? sort.slice(1) : sort;
  const order =
    field === "name"
      ? a.name.localeCompare(b.name)
      : a.created_at.localeCompare(b.created_at);
  // Ties fall back to id so pages cannot overlap.
  return (descending ? -order : order) || a.id.localeCompare(b.id);
}

export function listCompanies(input: ListInput): CompanyList {
  const needle = input.q?.toLowerCase();
  const matches = companies()
    .filter((company) => !input.status || company.status === input.status)
    .filter(
      (company) =>
        !needle ||
        company.name.toLowerCase().includes(needle) ||
        company.domain?.toLowerCase().includes(needle),
    )
    .sort((a, b) => compare(a, b, input.sort));

  return {
    items: matches.slice(input.offset, input.offset + input.limit),
    total: matches.length,
    limit: input.limit,
    offset: input.offset,
  };
}

export function findCompany(id: string): Company | undefined {
  return companies().find((company) => company.id === id);
}

export function createCompany(input: CreateInput): Company {
  const now = new Date().toISOString();
  const company: Company = {
    id: crypto.randomUUID(),
    name: input.name,
    domain: input.domain,
    status: input.status,
    version: 1,
    created_at: now,
    updated_at: now,
  };
  companies().push(company);
  return company;
}

export type UpdateOutcome =
  | { kind: "updated"; company: Company }
  | { kind: "not_found" }
  | { kind: "conflict" };

export function updateCompany(id: string, input: UpdateInput): UpdateOutcome {
  const { if_version: ifVersion, ...changes } = input;
  const current = findCompany(id);
  if (!current) return { kind: "not_found" };
  if (current.version !== ifVersion) return { kind: "conflict" };

  const updated: Company = {
    ...current,
    ...changes,
    version: current.version + 1,
    updated_at: new Date().toISOString(),
  };
  companies()[companies().indexOf(current)] = updated;
  return { kind: "updated", company: updated };
}

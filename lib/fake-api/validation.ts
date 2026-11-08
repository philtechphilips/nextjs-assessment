import {
  COMPANY_SORTS,
  COMPANY_STATUSES,
  type CompanySort,
  type CompanyStatus,
  type ValidationIssue,
} from "@/lib/api/schema";

export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

export type ListInput = {
  limit: number;
  offset: number;
  q: string | undefined;
  status: CompanyStatus | undefined;
  sort: CompanySort;
};

export type CreateInput = {
  name: string;
  domain: string | null;
  status: CompanyStatus;
};

export type UpdateInput = {
  if_version: number;
  name?: string;
  domain?: string | null;
  status?: CompanyStatus;
};

const MAX_LIMIT = 100;

function issue(
  location: "query" | "body",
  field: string,
  msg: string,
): ValidationIssue {
  return { loc: [location, field], msg, type: "value_error" };
}

function isOneOf<T extends string>(
  allowed: readonly T[],
  value: unknown,
): value is T {
  return (allowed as readonly unknown[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseIntegerParam(
  raw: string | null,
  field: string,
  { fallback, min, max }: { fallback: number; min: number; max: number },
  issues: ValidationIssue[],
): number {
  if (raw === null) return fallback;
  const value = Number(raw);
  if (Number.isInteger(value) && value >= min && value <= max) return value;
  issues.push(issue("query", field, `Must be between ${min} and ${max}.`));
  return fallback;
}

function parseEnumParam<T extends string>(
  raw: string | null,
  field: string,
  allowed: readonly T[],
  issues: ValidationIssue[],
): T | undefined {
  if (raw === null) return undefined;
  if (isOneOf(allowed, raw)) return raw;
  issues.push(issue("query", field, `Unknown ${field}.`));
  return undefined;
}

export function parseListQuery(search: URLSearchParams): Parsed<ListInput> {
  const issues: ValidationIssue[] = [];
  const limit = parseIntegerParam(
    search.get("limit"),
    "limit",
    { fallback: 20, min: 1, max: MAX_LIMIT },
    issues,
  );
  const offset = parseIntegerParam(
    search.get("offset"),
    "offset",
    { fallback: 0, min: 0, max: Number.MAX_SAFE_INTEGER },
    issues,
  );
  const status = parseEnumParam(
    search.get("status"),
    "status",
    COMPANY_STATUSES,
    issues,
  );
  const sort =
    parseEnumParam(search.get("sort"), "sort", COMPANY_SORTS, issues) ??
    "-created_at";

  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    value: {
      limit,
      offset,
      q: search.get("q")?.trim() || undefined,
      status,
      sort,
    },
  };
}

function parseName(value: unknown, issues: ValidationIssue[]): string {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(issue("body", "name", "Name must not be empty."));
    return "";
  }
  return value.trim();
}

function parseDomain(
  value: unknown,
  issues: ValidationIssue[],
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    issues.push(issue("body", "domain", "Domain must be a string."));
    return null;
  }
  return value.trim() || null;
}

function parseStatus(
  value: unknown,
  issues: ValidationIssue[],
): CompanyStatus | undefined {
  if (value === undefined) return undefined;
  if (isOneOf(COMPANY_STATUSES, value)) return value;
  issues.push(issue("body", "status", "Unknown status."));
  return undefined;
}

const invalidBody: Parsed<never> = {
  ok: false,
  issues: [issue("body", "body", "Expected a JSON object.")],
};

export function parseCreateBody(body: unknown): Parsed<CreateInput> {
  if (!isRecord(body)) return invalidBody;

  const issues: ValidationIssue[] = [];
  const name = parseName(body.name, issues);
  const domain = parseDomain(body.domain, issues);
  const status = parseStatus(body.status, issues) ?? "new";

  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: { name, domain, status } };
}

export function parseUpdateBody(body: unknown): Parsed<UpdateInput> {
  if (!isRecord(body)) return invalidBody;

  const issues: ValidationIssue[] = [];
  const { if_version: ifVersion } = body;
  if (typeof ifVersion !== "number" || !Number.isInteger(ifVersion)) {
    issues.push(issue("body", "if_version", "An integer version is required."));
  }

  const value: UpdateInput = { if_version: Number(ifVersion) };
  if ("name" in body) value.name = parseName(body.name, issues);
  if ("domain" in body) value.domain = parseDomain(body.domain, issues);
  if ("status" in body) value.status = parseStatus(body.status, issues);

  return issues.length > 0 ? { ok: false, issues } : { ok: true, value };
}

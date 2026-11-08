import { ApiError } from "@/lib/api/http";
import type {
  Company,
  CompanyStatus,
  CreateCompanyBody,
} from "@/lib/api/schema";
import type { MessageKey } from "@/lib/i18n/messages/en";

/** What the form edits: every field is a plain value an input can hold. */
export type CompanyDraft = {
  name: string;
  domain: string;
  status: CompanyStatus;
};

export const DRAFT_FIELDS = ["name", "domain", "status"] as const;
export type DraftField = (typeof DRAFT_FIELDS)[number];

export type FieldMap<T> = Partial<Record<DraftField, T>>;

export const EMPTY_DRAFT: CompanyDraft = {
  name: "",
  domain: "",
  status: "new",
};

export function toDraft(company: Company): CompanyDraft {
  return {
    name: company.name,
    domain: company.domain ?? "",
    status: company.status,
  };
}

export function toRequestBody(draft: CompanyDraft) {
  return {
    name: draft.name.trim(),
    domain: draft.domain.trim() || null,
    status: draft.status,
  } satisfies CreateCompanyBody;
}

/** Mirrors the API rules: the only constraint on input is a non-empty name. */
export function validateDraft(draft: CompanyDraft): FieldMap<MessageKey> {
  return draft.name.trim() ? {} : { name: "validation.nameRequired" };
}

/**
 * Moves a draft onto a newer version of the record: fields the user edited
 * keep the user's value, the others take the latest value.
 */
export function rebaseDraft(
  draft: CompanyDraft,
  base: CompanyDraft,
  latest: CompanyDraft,
): CompanyDraft {
  const resolve = <F extends DraftField>(field: F): CompanyDraft[F] =>
    draft[field] === base[field] ? latest[field] : draft[field];

  return {
    name: resolve("name"),
    domain: resolve("domain"),
    status: resolve("status"),
  };
}

/** Fields someone else changed and where the draft still says something else. */
export function conflictingFields(
  draft: CompanyDraft,
  base: CompanyDraft,
  latest: CompanyDraft,
): DraftField[] {
  return DRAFT_FIELDS.filter(
    (field) => base[field] !== latest[field] && draft[field] !== latest[field],
  );
}

type ValidationFailure = {
  fields: FieldMap<string>;
  other: string[];
};

/** Reads a FastAPI 422 body; returns null for any other kind of error. */
export function parseValidationFailure(
  error: unknown,
): ValidationFailure | null {
  if (
    !(error instanceof ApiError) ||
    error.status !== 422 ||
    !Array.isArray(error.detail)
  ) {
    return null;
  }

  const failure: ValidationFailure = { fields: {}, other: [] };
  for (const { loc, msg } of error.detail) {
    const field = DRAFT_FIELDS.find((name) => name === loc.at(-1));
    if (field) failure.fields[field] = msg;
    else failure.other.push(msg);
  }
  return failure;
}

import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/http";
import {
  conflictingFields,
  parseValidationFailure,
  rebaseDraft,
  toRequestBody,
  validateDraft,
  type CompanyDraft,
} from "./company-draft";

const base: CompanyDraft = { name: "Acme", domain: "acme.example", status: "new" };

describe("validateDraft", () => {
  it.each(["", "   "])("rejects the name %j", (name) => {
    expect(validateDraft({ ...base, name })).toEqual({
      name: "validation.nameRequired",
    });
  });

  it("accepts a draft with a name and no domain", () => {
    expect(validateDraft({ ...base, domain: "" })).toEqual({});
  });
});

describe("toRequestBody", () => {
  it("trims text and sends an empty domain as null", () => {
    expect(
      toRequestBody({ name: "  Acme ", domain: "  ", status: "new" }),
    ).toEqual({ name: "Acme", domain: null, status: "new" });
  });
});

describe("rebaseDraft", () => {
  const latest: CompanyDraft = {
    name: "Acme Holding",
    domain: "acme.example",
    status: "qualified",
  };

  it("keeps what the user edited", () => {
    const draft = { ...base, name: "Acme BV" };
    expect(rebaseDraft(draft, base, latest).name).toBe("Acme BV");
  });

  it("takes the latest value for fields the user left alone", () => {
    const draft = { ...base, name: "Acme BV" };
    expect(rebaseDraft(draft, base, latest).status).toBe("qualified");
  });
});

describe("conflictingFields", () => {
  it("flags a field both sides changed to different values", () => {
    const latest = { ...base, name: "Acme Holding" };
    const draft = { ...base, name: "Acme BV" };
    expect(conflictingFields(draft, base, latest)).toEqual(["name"]);
  });

  it("ignores a field only the user changed", () => {
    const draft = { ...base, name: "Acme BV" };
    expect(conflictingFields(draft, base, base)).toEqual([]);
  });

  it("ignores a field both sides changed to the same value", () => {
    const changed = { ...base, name: "Acme BV" };
    expect(conflictingFields(changed, base, changed)).toEqual([]);
  });
});

describe("parseValidationFailure", () => {
  it("sorts issues into known fields and everything else", () => {
    const error = new ApiError(422, [
      { loc: ["body", "name"], msg: "Name is taken", type: "value_error" },
      { loc: ["body", "tenant"], msg: "Tenant is closed", type: "value_error" },
    ]);
    expect(parseValidationFailure(error)).toEqual({
      fields: { name: "Name is taken" },
      other: ["Tenant is closed"],
    });
  });

  it("returns null for other errors", () => {
    expect(parseValidationFailure(new ApiError(500, undefined))).toBeNull();
    expect(parseValidationFailure(new Error("boom"))).toBeNull();
  });
});

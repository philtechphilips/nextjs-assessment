import { describe, expect, it } from "vitest";
import {
  parseCompaniesUrl,
  serializeCompaniesUrl,
  toListParams,
  type CompaniesUrlState,
} from "./url-state";

const DEFAULTS: CompaniesUrlState = {
  q: "",
  status: null,
  sort: "-created_at",
  page: 1,
  company: null,
};

const parse = (search: string) =>
  parseCompaniesUrl(new URLSearchParams(search));

describe("parseCompaniesUrl", () => {
  it("returns defaults for an empty URL", () => {
    expect(parse("")).toEqual(DEFAULTS);
  });

  it("reads every param", () => {
    expect(
      parse("q=acme&status=qualified&sort=name&page=3&company=company-01"),
    ).toEqual({
      q: "acme",
      status: "qualified",
      sort: "name",
      page: 3,
      company: "company-01",
    });
  });

  it.each(["page=0", "page=-1", "page=2.5", "page=abc"])(
    "falls back to page 1 for %s",
    (search) => {
      expect(parse(search).page).toBe(1);
    },
  );

  it("ignores values the API would reject", () => {
    expect(parse("status=nope&sort=nope")).toEqual(DEFAULTS);
  });
});

describe("serializeCompaniesUrl", () => {
  it("leaves out defaults so a state has one URL", () => {
    expect(serializeCompaniesUrl(DEFAULTS)).toBe("");
  });

  it("round-trips a full state", () => {
    const state: CompaniesUrlState = {
      q: "de vries & co",
      status: "contacted",
      sort: "-name",
      page: 2,
      company: "company-07",
    };
    expect(parse(serializeCompaniesUrl(state))).toEqual(state);
  });
});

describe("toListParams", () => {
  it("converts the 1-based page to an offset", () => {
    expect(toListParams({ ...DEFAULTS, page: 3 })).toMatchObject({
      limit: 20,
      offset: 40,
    });
  });

  it("does not depend on which company is open", () => {
    expect(toListParams({ ...DEFAULTS, company: "company-01" })).toEqual(
      toListParams(DEFAULTS),
    );
  });
});

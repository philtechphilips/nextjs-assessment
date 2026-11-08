import { hashKey } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import {
  companyKeys,
  getCompany,
  listCompaniesOptions,
  listCompaniesPath,
} from "./companies";
import { ApiError } from "./http";

describe("company query keys", () => {
  it("treats a blank search the same as no search", () => {
    expect(hashKey(companyKeys.list({ q: "   ", limit: 20 }))).toBe(
      hashKey(companyKeys.list({ limit: 20 })),
    );
  });

  it("ignores surrounding whitespace in the search term", () => {
    expect(hashKey(companyKeys.list({ q: " acme " }))).toBe(
      hashKey(companyKeys.list({ q: "acme" })),
    );
  });

  it("does not depend on the order params are given in", () => {
    expect(hashKey(companyKeys.list({ limit: 20, offset: 40 }))).toBe(
      hashKey(companyKeys.list({ offset: 40, limit: 20 })),
    );
  });

  it("gives each filter combination its own key", () => {
    expect(hashKey(companyKeys.list({ status: "new" }))).not.toBe(
      hashKey(companyKeys.list({ status: "qualified" })),
    );
  });

  it("nests lists under the prefix mutations invalidate", () => {
    const key = listCompaniesOptions({ q: "acme" }).queryKey;
    expect(key.slice(0, companyKeys.lists().length)).toEqual(
      companyKeys.lists(),
    );
  });
});

describe("listCompaniesPath", () => {
  it("leaves out params that have no value", () => {
    expect(listCompaniesPath({ q: "  ", status: undefined })).toBe(
      "/companies",
    );
  });

  it("encodes the params the API accepts", () => {
    expect(
      listCompaniesPath({
        q: "a&b",
        status: "new",
        sort: "-name",
        limit: 20,
        offset: 40,
      }),
    ).toBe("/companies?limit=20&offset=40&q=a%26b&status=new&sort=-name");
  });
});

describe("request", () => {
  it("attaches the current token as a bearer header", async () => {
    window.localStorage.setItem("access_token", "rotated-token");
    let authorization: string | null = null;
    server.use(
      http.get("*/api/v1/companies/:id", ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({ id: "1" });
      }),
    );

    await getCompany("1");

    expect(authorization).toBe("Bearer rotated-token");
  });

  it("throws an ApiError carrying the status and detail", async () => {
    server.use(
      http.get("*/api/v1/companies/:id", () =>
        HttpResponse.json({ detail: "Company not found" }, { status: 404 }),
      ),
    );

    const error = await getCompany("missing").catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, detail: "Company not found" });
  });
});

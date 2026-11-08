import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./return-to";

describe("safeReturnTo", () => {
  it("keeps a local path and its query string", () => {
    expect(safeReturnTo("/companies?status=new&company=company-01")).toBe(
      "/companies?status=new&company=company-01",
    );
  });

  it.each([
    ["an absolute URL", "https://evil.example/"],
    ["a protocol-relative URL", "//evil.example/"],
    ["a backslash variant", "/\\evil.example/"],
    ["a repeated param", ["/companies", "/other"]],
    ["nothing", undefined],
  ])("falls back for %s", (_label, value) => {
    expect(safeReturnTo(value)).toBe("/companies");
  });
});

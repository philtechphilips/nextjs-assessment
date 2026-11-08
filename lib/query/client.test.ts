import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/http";
import { shouldRetry } from "./client";

describe("shouldRetry", () => {
  it("does not retry client errors", () => {
    expect(shouldRetry(0, new ApiError(404, undefined))).toBe(false);
  });

  it("retries server and network errors twice", () => {
    expect(shouldRetry(0, new ApiError(503, undefined))).toBe(true);
    expect(shouldRetry(1, new TypeError("Failed to fetch"))).toBe(true);
    expect(shouldRetry(2, new ApiError(503, undefined))).toBe(false);
  });
});

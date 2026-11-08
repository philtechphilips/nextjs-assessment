import { getAccessToken } from "@/lib/auth/session";
import type { ErrorResponse } from "./schema";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: ErrorResponse["detail"] | undefined,
  ) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
  }
}

export function isApiStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  signal?: AbortSignal;
};

/**
 * The one place that talks to the network. The token is read per request, so
 * components never handle it and a rotated token is picked up automatically.
 */
export async function request<T>(
  path: string,
  { method = "GET", body, signal }: RequestOptions = {},
): Promise<T> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  const response = await fetch(`/api/v1${path}`, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorDetail(response));
  }
  return (await response.json()) as T;
}

async function readErrorDetail(
  response: Response,
): Promise<ErrorResponse["detail"] | undefined> {
  try {
    return ((await response.json()) as ErrorResponse).detail;
  } catch {
    return undefined;
  }
}

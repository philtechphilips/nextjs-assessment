import type { ValidationIssue } from "@/lib/api/schema";

const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 800;

function simulateLatency(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasBearerToken(request: Request): boolean {
  return /^Bearer\s+\S+/i.test(request.headers.get("authorization") ?? "");
}

export function errorResponse(status: number, detail: string): Response {
  return Response.json({ detail }, { status });
}

export function validationResponse(issues: ValidationIssue[]): Response {
  return Response.json({ detail: issues }, { status: 422 });
}

/** Resolves to undefined for an unparseable body, which validation rejects. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

type Handler<Context> = (
  request: Request,
  context: Context,
) => Response | Promise<Response>;

/** Applies what every endpoint shares: artificial latency and the auth check. */
export function apiRoute<Context = unknown>(handler: Handler<Context>) {
  return async (request: Request, context: Context): Promise<Response> => {
    await simulateLatency();
    if (!hasBearerToken(request)) {
      return errorResponse(401, "Not authenticated");
    }
    return handler(request, context);
  };
}

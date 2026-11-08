import {
  apiRoute,
  errorResponse,
  readJson,
  validationResponse,
} from "@/lib/fake-api/http";
import { findCompany, updateCompany } from "@/lib/fake-api/store";
import { parseUpdateBody } from "@/lib/fake-api/validation";

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = "Company not found";

export const GET = apiRoute<Context>(async (_request, { params }) => {
  const { id } = await params;
  const company = findCompany(id);
  return company ? Response.json(company) : errorResponse(404, NOT_FOUND);
});

export const PATCH = apiRoute<Context>(async (request, { params }) => {
  const { id } = await params;
  const body = parseUpdateBody(await readJson(request));
  if (!body.ok) return validationResponse(body.issues);

  const outcome = updateCompany(id, body.value);
  switch (outcome.kind) {
    case "updated":
      return Response.json(outcome.company);
    case "not_found":
      return errorResponse(404, NOT_FOUND);
    case "conflict":
      return errorResponse(409, "Company was changed by someone else");
  }
});

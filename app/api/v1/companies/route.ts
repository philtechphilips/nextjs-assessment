import { apiRoute, readJson, validationResponse } from "@/lib/fake-api/http";
import { createCompany, listCompanies } from "@/lib/fake-api/store";
import { parseCreateBody, parseListQuery } from "@/lib/fake-api/validation";

export const GET = apiRoute((request) => {
  const query = parseListQuery(new URL(request.url).searchParams);
  if (!query.ok) return validationResponse(query.issues);
  return Response.json(listCompanies(query.value));
});

export const POST = apiRoute(async (request) => {
  const body = parseCreateBody(await readJson(request));
  if (!body.ok) return validationResponse(body.issues);
  return Response.json(createCompany(body.value), { status: 201 });
});

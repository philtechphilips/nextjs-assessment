import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { Company, CompanyList } from "@/lib/api/schema";
import { makeCompany, renderWithProviders } from "@/test/render";
import { server } from "@/test/server";
import { CompaniesScreen } from "./companies-screen";

const ACME = makeCompany({ id: "acme", name: "Acme", status: "new" });
const GLOBEX = makeCompany({
  id: "globex",
  name: "Globex",
  domain: "globex.example",
  status: "qualified",
});

/** Serves a small data set and records the query of every list request. */
function serveCompanies(companies: Company[] = [ACME, GLOBEX]) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get("*/api/v1/companies", ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const status = params.get("status");
      const q = params.get("q");
      const items = companies
        .filter((company) => !status || company.status === status)
        .filter((company) => !q || company.name.toLowerCase().includes(q));
      return HttpResponse.json<CompanyList>({
        items,
        total: items.length,
        limit: 20,
        offset: Number(params.get("offset")),
      });
    }),
  );
  return requests;
}

function lastOf(requests: URLSearchParams[]): URLSearchParams {
  const last = requests.at(-1);
  if (!last) throw new Error("No list request was made");
  return last;
}

describe("companies list", () => {
  it("shows the companies returned by the API", async () => {
    serveCompanies();
    renderWithProviders(<CompaniesScreen />);

    expect(await screen.findByRole("link", { name: "Acme" })).toBeVisible();
    const row = screen.getByRole("row", { name: /Globex/ });
    expect(within(row).getByText("globex.example")).toBeVisible();
    expect(within(row).getByText("Qualified")).toBeVisible();
    expect(within(row).getByText("Jan 15, 2026")).toBeVisible();
  });

  it("filters by status through the URL and the request", async () => {
    const requests = serveCompanies();
    const user = userEvent.setup();
    renderWithProviders(<CompaniesScreen />);
    await screen.findByRole("link", { name: "Acme" });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Status" }),
      "qualified",
    );

    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Acme" })).toBeNull(),
    );
    expect(screen.getByRole("link", { name: "Globex" })).toBeVisible();
    expect(lastOf(requests).get("status")).toBe("qualified");
    expect(window.location.search).toBe("?status=qualified");
  });

  it("debounces search into one request and the URL", async () => {
    const requests = serveCompanies();
    const user = userEvent.setup();
    renderWithProviders(<CompaniesScreen />);
    await screen.findByRole("link", { name: "Acme" });
    const requestsBefore = requests.length;

    await user.type(
      screen.getByRole("searchbox", { name: /search/i }),
      "glob",
    );

    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Acme" })).toBeNull(),
    );
    expect(requests).toHaveLength(requestsBefore + 1);
    expect(lastOf(requests).get("q")).toBe("glob");
    expect(window.location.search).toBe("?q=glob");
  });

  it("keeps the same table and its rows on screen while a filter loads", async () => {
    serveCompanies();
    const user = userEvent.setup();
    renderWithProviders(<CompaniesScreen />);
    await screen.findByRole("link", { name: "Acme" });
    const table = screen.getByRole("table");

    let respond = () => {};
    const responseGate = new Promise<void>((resolve) => {
      respond = resolve;
    });
    server.use(
      http.get("*/api/v1/companies", async () => {
        await responseGate;
        return HttpResponse.json<CompanyList>({
          items: [GLOBEX],
          total: 1,
          limit: 20,
          offset: 0,
        });
      }),
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Status" }),
      "qualified",
    );

    await waitFor(() => expect(table).toHaveAttribute("aria-busy", "true"));
    expect(screen.getByRole("link", { name: "Acme" })).toBeVisible();

    act(() => respond());

    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Acme" })).toBeNull(),
    );
    expect(screen.getByRole("table")).toBe(table);
  });

  it("toggles sorting and exposes it on the column header", async () => {
    const requests = serveCompanies();
    const user = userEvent.setup();
    renderWithProviders(<CompaniesScreen />);
    await screen.findByRole("link", { name: "Acme" });

    await user.click(screen.getByRole("button", { name: "Name" }));
    await waitFor(() => expect(lastOf(requests).get("sort")).toBe("name"));
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    await user.click(screen.getByRole("button", { name: /^Name/ }));
    await waitFor(() => expect(lastOf(requests).get("sort")).toBe("-name"));
    expect(window.location.search).toBe("?sort=-name");
  });

  it("starts from the state in the URL, as after a refresh", async () => {
    window.history.replaceState(
      null,
      "",
      "/companies?status=qualified&page=2&sort=name",
    );
    const requests = serveCompanies();
    renderWithProviders(<CompaniesScreen />);

    await screen.findByRole("link", { name: "Globex" });

    expect(lastOf(requests).get("offset")).toBe("20");
    expect(lastOf(requests).get("status")).toBe("qualified");
    expect(lastOf(requests).get("sort")).toBe("name");
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue(
      "qualified",
    );
  });

  it("restores the previous filters on the back button", async () => {
    serveCompanies();
    const user = userEvent.setup();
    renderWithProviders(<CompaniesScreen />);
    await screen.findByRole("link", { name: "Acme" });
    const status = screen.getByRole("combobox", { name: "Status" });

    await user.selectOptions(status, "qualified");
    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Acme" })).toBeNull(),
    );

    act(() => window.history.back());

    expect(await screen.findByRole("link", { name: "Acme" })).toBeVisible();
    expect(status).toHaveValue("");
  });

  it("goes back to page 1 when a filter changes", async () => {
    window.history.replaceState(null, "", "/companies?page=3");
    const requests = serveCompanies();
    const user = userEvent.setup();
    renderWithProviders(<CompaniesScreen />);
    await screen.findByRole("link", { name: "Acme" });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Status" }),
      "new",
    );

    await waitFor(() => expect(lastOf(requests).get("offset")).toBe("0"));
    expect(window.location.search).toBe("?status=new");
  });

  it("offers to clear filters when nothing matches", async () => {
    window.history.replaceState(null, "", "/companies?status=rejected");
    serveCompanies();
    const user = userEvent.setup();
    renderWithProviders(<CompaniesScreen />);

    expect(
      await screen.findByText("No companies match your search or filter."),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(await screen.findByRole("link", { name: "Acme" })).toBeVisible();
    expect(window.location.search).toBe("");
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get("*/api/v1/companies", () =>
        HttpResponse.json({ detail: "Boom" }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<CompaniesScreen />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The companies could not be loaded.");

    serveCompanies();
    await user.click(within(alert).getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("link", { name: "Acme" })).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("signals an expired session on a 401", async () => {
    server.use(
      http.get("*/api/v1/companies", () =>
        HttpResponse.json({ detail: "Not authenticated" }, { status: 401 }),
      ),
    );
    const { onUnauthorized } = renderWithProviders(<CompaniesScreen />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it("opens the drawer from a row and reflects it in the URL", async () => {
    serveCompanies();
    server.use(
      http.get("*/api/v1/companies/:id", () => HttpResponse.json(ACME)),
    );
    const user = userEvent.setup();
    renderWithProviders(<CompaniesScreen />);

    await user.click(await screen.findByRole("link", { name: "Acme" }));

    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(await screen.findByLabelText("Name")).toHaveValue("Acme");
    expect(window.location.search).toBe("?company=acme");

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("opens the drawer directly from a shared link", async () => {
    window.history.replaceState(null, "", "/companies?company=acme");
    serveCompanies();
    server.use(
      http.get("*/api/v1/companies/:id", () => HttpResponse.json(ACME)),
    );
    renderWithProviders(<CompaniesScreen />);

    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(await screen.findByLabelText("Name")).toHaveValue("Acme");
  });
});

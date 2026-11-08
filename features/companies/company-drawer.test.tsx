import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { companyKeys } from "@/lib/api/companies";
import type { Company, UpdateCompanyBody } from "@/lib/api/schema";
import { makeCompany, renderWithProviders } from "@/test/render";
import { server } from "@/test/server";
import { CompanyDrawer } from "./company-drawer";

const OPENED = makeCompany({ version: 3 });
const CHANGED_BY_SOMEONE_ELSE = makeCompany({
  version: 4,
  name: "Acme Holding",
  status: "qualified",
});

/** Plays the API: PATCH applies only when if_version is the stored version. */
function serveCompany(initial: Company) {
  const state = {
    stored: initial,
    patches: [] as UpdateCompanyBody[],
  };
  server.use(
    http.get("*/api/v1/companies/:id", () => HttpResponse.json(state.stored)),
    http.patch("*/api/v1/companies/:id", async ({ request }) => {
      const body = (await request.json()) as UpdateCompanyBody;
      state.patches.push(body);
      if (body.if_version !== state.stored.version) {
        return HttpResponse.json({ detail: "Conflict" }, { status: 409 });
      }
      const { if_version: ifVersion, ...changes } = body;
      state.stored = {
        ...state.stored,
        ...changes,
        version: ifVersion + 1,
      };
      return HttpResponse.json(state.stored);
    }),
  );
  return state;
}

function renderDrawer(target = OPENED.id) {
  return renderWithProviders(
    <CompanyDrawer target={target} onClose={vi.fn()} onCreated={vi.fn()} />,
  );
}

async function replaceText(label: string, text: string) {
  const user = userEvent.setup();
  const input = await screen.findByLabelText(label);
  await user.clear(input);
  await user.type(input, text);
  return user;
}

describe("editing a company", () => {
  it("sends the opened version and reports success", async () => {
    const api = serveCompany(OPENED);
    renderDrawer();

    const user = await replaceText("Name", "Acme BV");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Changes saved.")).toBeVisible();
    expect(api.patches).toEqual([
      expect.objectContaining({ if_version: 3, name: "Acme BV" }),
    ]);
  });

  it("uses the new version for the next save", async () => {
    const api = serveCompany(OPENED);
    renderDrawer();

    const user = await replaceText("Name", "Acme BV");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Changes saved.");

    await user.type(screen.getByLabelText("Name"), " Group");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(api.patches).toHaveLength(2));
    expect(api.patches[1]?.if_version).toBe(4);
  });

  it("does not let a background refetch change the version it sends", async () => {
    const api = serveCompany(OPENED);
    const { queryClient } = renderDrawer();
    const user = await replaceText("Name", "Acme BV");

    api.stored = CHANGED_BY_SOMEONE_ELSE;
    await queryClient.refetchQueries({
      queryKey: companyKeys.detail(OPENED.id),
    });
    expect(screen.getByLabelText("Name")).toHaveValue("Acme BV");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(api.patches[0]?.if_version).toBe(3));
  });
});

describe("typing while a save is in flight", () => {
  it("keeps the text and still picks up the new version", async () => {
    const api = serveCompany(OPENED);
    let respond = () => {};
    const responseGate = new Promise<void>((resolve) => {
      respond = resolve;
    });
    server.use(
      http.patch(
        "*/api/v1/companies/:id",
        async ({ request }) => {
          const body = (await request.json()) as UpdateCompanyBody;
          api.patches.push(body);
          await responseGate;
          api.stored = { ...api.stored, name: "Acme BV", version: 4 };
          return HttpResponse.json(api.stored);
        },
        { once: true },
      ),
    );
    renderDrawer();

    const user = await replaceText("Name", "Acme BV");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.patches).toHaveLength(1));
    await user.type(screen.getByLabelText("Name"), " Group");
    act(() => respond());

    await screen.findByText("Changes saved.");
    expect(screen.getByLabelText("Name")).toHaveValue("Acme BV Group");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(api.patches).toHaveLength(2));
    expect(api.patches[1]).toMatchObject({
      if_version: 4,
      name: "Acme BV Group",
    });
  });
});

describe("when someone else changed the company (409)", () => {
  async function reachConflict() {
    const api = serveCompany(OPENED);
    const rendered = renderDrawer();
    const user = await replaceText("Name", "Acme BV");
    api.stored = CHANGED_BY_SOMEONE_ELSE;
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText(/Someone else changed this company/);
    return { api, user, ...rendered };
  }

  it("tells the user and keeps what they typed", async () => {
    await reachConflict();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your changes have not been saved",
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Acme BV");
  });

  it("blocks saving until the latest version is loaded", async () => {
    const { api, user } = await reachConflict();

    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toHaveAttribute("aria-disabled", "true");
    await user.click(save);

    expect(api.patches).toHaveLength(1);
  });

  it("marks cached lists as stale", async () => {
    const api = serveCompany(OPENED);
    const { queryClient } = renderDrawer();
    const listKey = companyKeys.list({ limit: 20 });
    queryClient.setQueryData(listKey, { items: [], total: 0 });

    const user = await replaceText("Name", "Acme BV");
    api.stored = CHANGED_BY_SOMEONE_ELSE;
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText(/Someone else changed this company/);

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
  });

  it("merges the latest version into the form on reload", async () => {
    const { user } = await reachConflict();

    await user.click(
      screen.getByRole("button", { name: "Load latest version" }),
    );

    expect(await screen.findByText(/your edits are kept/)).toBeVisible();
    expect(screen.getByLabelText("Name")).toHaveValue("Acme BV");
    // Left alone by this user, so it takes the other person's change.
    expect(screen.getByLabelText("Status")).toHaveValue("qualified");
    expect(
      screen.getByText("Latest saved value: Acme Holding"),
    ).toBeVisible();
    expect(screen.getByText("4")).toBeVisible();
  });

  it("saves against the reloaded version", async () => {
    const { api, user } = await reachConflict();
    await user.click(
      screen.getByRole("button", { name: "Load latest version" }),
    );
    await screen.findByText(/your edits are kept/);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Changes saved.")).toBeVisible();
    expect(api.patches.at(-1)).toMatchObject({
      if_version: 4,
      name: "Acme BV",
      status: "qualified",
    });
    expect(screen.queryByText(/Latest saved value/)).toBeNull();
  });

  it("keeps the draft and offers another try if reloading fails", async () => {
    const { user } = await reachConflict();
    server.use(
      http.get("*/api/v1/companies/:id", () =>
        HttpResponse.json({ detail: "Boom" }, { status: 500 }),
      ),
    );

    await user.click(
      screen.getByRole("button", { name: "Load latest version" }),
    );

    expect(
      await screen.findByText("The latest version could not be loaded."),
    ).toBeVisible();
    expect(screen.getByLabelText("Name")).toHaveValue("Acme BV");
    expect(
      screen.getByRole("button", { name: "Load latest version" }),
    ).toBeVisible();
  });
});

describe("validation", () => {
  it("blocks an empty name and focuses the field", async () => {
    const api = serveCompany(OPENED);
    renderDrawer();
    const user = userEvent.setup();

    await user.clear(await screen.findByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    const name = screen.getByLabelText("Name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveFocus();
    expect(name).toHaveAccessibleDescription("Enter a name.");
    expect(screen.getByText("Enter a name.")).toHaveRole("alert");
    expect(api.patches).toHaveLength(0);
  });

  it("shows a 422 from the API on the field it belongs to", async () => {
    serveCompany(OPENED);
    server.use(
      http.patch("*/api/v1/companies/:id", () =>
        HttpResponse.json(
          {
            detail: [
              { loc: ["body", "domain"], msg: "Domain is taken", type: "x" },
            ],
          },
          { status: 422 },
        ),
      ),
    );
    renderDrawer();

    const user = await replaceText("Domain", "taken.example");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Domain is taken")).toBeVisible();
    expect(screen.getByLabelText("Domain")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Domain")).toHaveValue("taken.example");
  });

  it("clears a 422 as soon as the field is edited", async () => {
    serveCompany(OPENED);
    server.use(
      http.patch("*/api/v1/companies/:id", () =>
        HttpResponse.json(
          { detail: [{ loc: ["body", "name"], msg: "Too odd", type: "x" }] },
          { status: 422 },
        ),
      ),
    );
    renderDrawer();

    const user = await replaceText("Name", "Odd");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Too odd");

    await user.type(screen.getByLabelText("Name"), "er");

    expect(screen.queryByText("Too odd")).toBeNull();
  });
});

describe("drawer states", () => {
  it("shows loading, then the form", async () => {
    serveCompany(OPENED);
    renderDrawer();

    expect(screen.getByText("Loading company…")).toBeVisible();
    expect(await screen.findByLabelText("Name")).toHaveValue("Acme");
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get("*/api/v1/companies/:id", () =>
        HttpResponse.json({ detail: "Boom" }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderDrawer();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The company could not be loaded.");

    serveCompany(OPENED);
    await user.click(within(alert).getByRole("button", { name: "Try again" }));

    expect(await screen.findByLabelText("Name")).toHaveValue("Acme");
  });

  it("says so when the company does not exist", async () => {
    server.use(
      http.get("*/api/v1/companies/:id", () =>
        HttpResponse.json({ detail: "Not found" }, { status: 404 }),
      ),
    );
    renderDrawer();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This company does not exist.",
    );
  });
});

describe("creating a company", () => {
  it("posts the form and reports the created company", async () => {
    const created = makeCompany({ id: "created", name: "Initech" });
    let body: unknown;
    server.use(
      http.post("*/api/v1/companies", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const onCreated = vi.fn();
    renderWithProviders(
      <CompanyDrawer target="new" onClose={vi.fn()} onCreated={onCreated} />,
    );

    const user = await replaceText("Name", "Initech");
    await user.click(screen.getByRole("button", { name: "Create company" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(onCreated.mock.calls[0]?.[0]).toEqual(created);
    expect(body).toEqual({ name: "Initech", domain: null, status: "new" });
  });

  it("requires a name before posting", async () => {
    renderWithProviders(
      <CompanyDrawer target="new" onClose={vi.fn()} onCreated={vi.fn()} />,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Create company" }));

    expect(screen.getByLabelText("Name")).toHaveFocus();
    expect(screen.getByText("Enter a name.")).toHaveRole("alert");
  });
});

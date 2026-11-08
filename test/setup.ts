import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { server } from "./server";

vi.mock("next/navigation", () => import("./next-navigation"));

// jsdom has no modal behaviour. These stubs only cover open state and the
// close event; the focus trap and Escape are the browser's job.
HTMLDialogElement.prototype.showModal = function showModal() {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close() {
  if (!this.open) return;
  this.open = false;
  this.dispatchEvent(new Event("close"));
};

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

beforeEach(() => {
  window.localStorage.setItem("access_token", "test-token");
  window.history.replaceState(null, "", "/companies");
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  window.localStorage.clear();
});

afterAll(() => server.close());

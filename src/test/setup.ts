import "@testing-library/jest-dom/vitest";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { handlers, resetMockDb } from "../mocks/handlers";

HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
};

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => {
  resetMockDb();
});
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

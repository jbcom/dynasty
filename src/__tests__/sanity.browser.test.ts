import { describe, expect, it } from "vitest";

// Proves the `browser` Vitest project (Playwright/Chromium) runs with a real DOM.
describe("sanity (browser project)", () => {
  it("has a real DOM", () => {
    expect(typeof window).toBe("object");
    const el = document.createElement("div");
    el.textContent = "MAGA Money Moves";
    document.body.appendChild(el);
    expect(document.body.textContent).toContain("MAGA Money Moves");
    el.remove();
  });
});

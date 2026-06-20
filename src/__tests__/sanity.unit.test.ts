import { describe, expect, it } from "vitest";

// Proves the node `unit` Vitest project runs. Replaced by real sim tests in Phase B.
describe("sanity (unit project)", () => {
  it("runs in the node environment", () => {
    expect(typeof window).toBe("undefined");
    expect(1 + 1).toBe(2);
  });
});

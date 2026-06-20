import { describe, expect, it } from "vitest";
import { fixedClock, systemClock } from "../clock";

describe("clock", () => {
  it("systemClock returns a non-decreasing number", () => {
    const c = systemClock();
    const a = c.now();
    const b = c.now();
    expect(typeof a).toBe("number");
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it("fixedClock advances only when told", () => {
    const c = fixedClock(100);
    expect(c.now()).toBe(100);
    c.advance(50);
    expect(c.now()).toBe(150);
  });
});

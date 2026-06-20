import { describe, expect, it } from "vitest";
import { branchOf, isRoleFlipped } from "../branch";

const withFlags = (...flags: string[]) => ({ flags });

describe("branch resolution (alt-history)", () => {
  it("defaults to our timeline with no divergent flags", () => {
    expect(branchOf(withFlags())).toBe("default");
    expect(branchOf(withFlags("dynasty_capital", "consolidated_power"))).toBe("default");
  });

  it("detects each alternate-history backdrop from its Era-0 flags", () => {
    expect(branchOf(withFlags("axis_ascendant"))).toBe("nazi");
    expect(branchOf(withFlags("nazi_dynasty"))).toBe("nazi");
    expect(branchOf(withFlags("evangelical_scion"))).toBe("theocracy");
    expect(branchOf(withFlags("west_coast_origin"))).toBe("westcoast");
    expect(branchOf(withFlags("pleasure_king"))).toBe("media");
  });

  it("prefers the more-specific branch when several signatures coexist", () => {
    // Nazi outranks west-coast (a Nazi family could also have a coast origin).
    expect(branchOf(withFlags("west_coast_origin", "axis_ascendant"))).toBe("nazi");
  });

  it("reports the role-flip overlay independently of the backdrop", () => {
    expect(isRoleFlipped(withFlags("role_flip"))).toBe(true);
    expect(isRoleFlipped(withFlags("axis_ascendant"))).toBe(false);
    // The overlay rides on top of a backdrop without changing it.
    const s = withFlags("axis_ascendant", "role_flip");
    expect(branchOf(s)).toBe("nazi");
    expect(isRoleFlipped(s)).toBe(true);
  });
});

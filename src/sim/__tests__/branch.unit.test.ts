import { describe, expect, it } from "vitest";
import originsJson from "../../data/eras/origins.json";
import { branchOf } from "../branch";

const withFlags = (...flags: string[]) => ({ flags });

describe("every branch is reachable from an origins choice (nb-004 fix)", () => {
  // The flags an origins choice can set (a real player path).
  const originFlags = new Set(
    originsJson.events.flatMap((e) => (e.choices ?? []).flatMap((c) => c.setFlags ?? [])),
  );
  // branch signature flags (mirrors branch.ts) → each must be set by some origin.
  const signatures: Record<string, string[]> = {
    nazi: ["axis_ascendant", "nazi_dynasty", "arrived_as_nazi"],
    megachurch: ["megachurch_dynasty", "televangelist_empire"],
    theocracy: ["evangelical_scion", "faith_to_power", "evangelical_origin"],
    media: ["pleasure_king", "media_dynasty", "vice_empire"],
    westcoast: ["west_coast_origin", "west_coast_dynasty"],
  };
  for (const [branch, sigs] of Object.entries(signatures)) {
    it(`${branch} is reachable (an origins choice sets one of its signature flags)`, () => {
      expect(
        sigs.some((f) => originFlags.has(f)),
        `${branch} unreachable`,
      ).toBe(true);
    });
  }
});

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
    expect(branchOf(withFlags("megachurch_dynasty"))).toBe("megachurch");
    expect(branchOf(withFlags("oligarch_dynasty"))).toBe("oligarchy");
  });

  it("prefers the more-specific branch when several signatures coexist", () => {
    // Nazi outranks west-coast (a Nazi family could also have a coast origin).
    expect(branchOf(withFlags("west_coast_origin", "axis_ascendant"))).toBe("nazi");
  });
});

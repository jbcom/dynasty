import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import { ageInYear, hasFlag, initState, withFlag, withoutFlag } from "../state";
import { validRaw } from "./fixtures";

const content = () => buildContent(validRaw());

describe("game state", () => {
  it("initState starts at era 0, the first era's start year, full health", () => {
    const s = initState(content(), "seed");
    expect(s.eraIndex).toBe(0);
    expect(s.year).toBe(1946);
    expect(s.meters.health).toBe(100);
    expect(s.flags).toEqual(["trump_prologue"]);
    expect(s.end).toBeNull();
    expect(s.history).toEqual([]);
  });

  it("flag helpers are pure and keep flags sorted/deduped", () => {
    const a = withFlag([], "zebra");
    const b = withFlag(a, "apple");
    expect(b).toEqual(["apple", "zebra"]);
    expect(withFlag(b, "apple")).toEqual(["apple", "zebra"]); // dedup
    expect(withoutFlag(b, "zebra")).toEqual(["apple"]);
    expect(a).toEqual(["zebra"]); // original untouched
  });

  it("hasFlag reads membership", () => {
    const s = initState(content(), "seed");
    s.flags = ["disciplined"];
    expect(hasFlag(s, "disciplined")).toBe(true);
    expect(hasFlag(s, "nope")).toBe(false);
  });

  it("ageInYear derives age from birth year 1946", () => {
    expect(ageInYear(1946)).toBe(0);
    expect(ageInYear(2024)).toBe(78);
  });

  it("ageInYear is dynasty-relative when a birth year is given", () => {
    expect(ageInYear(1971, 1971)).toBe(0); // Musk born 1971
    expect(ageInYear(2024, 1971)).toBe(53);
    expect(ageInYear(1888, 1888)).toBe(0); // Kennedy patriarch born 1888
  });
});

describe("per-archetype Era-0 init (FD-3.5)", () => {
  it("defaults to the economic archetype (birth year 1946, seeds trump_prologue)", () => {
    const s = initState(content(), "seed");
    expect(s.archetype).toBe("economic");
    expect(s.birthYear).toBe(1946);
    // The economic archetype seeds the origins prologue flag from turn zero.
    expect(s.flags).toContain("trump_prologue");
  });

  it("a technological run carries birthYear 1971 + musk_dynasty_active flag from turn zero", () => {
    const s = initState(content(), "seed", "technological");
    expect(s.archetype).toBe("technological");
    expect(s.birthYear).toBe(1971);
    expect(s.flags).toContain("musk_dynasty_active");
    // age is birth-year-relative (negative before 1971 in a pre-birth start era).
    expect(s.age).toBe(s.year - 1971);
  });

  it("a political run carries birthYear 1888 + kennedy_dynasty_active flag from turn zero", () => {
    const s = initState(content(), "seed", "political");
    expect(s.archetype).toBe("political");
    expect(s.birthYear).toBe(1888);
    expect(s.flags).toContain("kennedy_dynasty_active");
    expect(s.age).toBe(s.year - 1888);
  });
});

import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import {
  ageInYear,
  hasFlag,
  initState,
  withFlag,
  withoutFlag,
} from "../state";
import { validRaw } from "./fixtures";

const content = () => buildContent(validRaw());

describe("game state", () => {
  it("initState starts at era 0, the first era's start year, full health", () => {
    const s = initState(content(), "seed");
    expect(s.eraIndex).toBe(0);
    expect(s.year).toBe(1946);
    expect(s.meters.health).toBe(100);
    expect(s.flags).toEqual([]);
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
});

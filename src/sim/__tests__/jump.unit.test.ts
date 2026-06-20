import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import type { Choice } from "../schema";
import { initState } from "../state";
import { applyJump } from "../timeline";
import { validRaw } from "./fixtures";

const content = () => buildContent(validRaw());

function choice(over: Partial<Choice>): Choice {
  return {
    id: "c",
    text: "t",
    effects: {},
    personality: {},
    setFlags: [],
    clearFlags: [],
    ripples: [],
    outcome: "o",
    ...over,
  };
}

describe("timeline hop (applyJump)", () => {
  it("returns the same state when the choice has no jumpTo", () => {
    const c = content();
    const s = initState(c, "seed");
    expect(applyJump(c, s, choice({}))).toBe(s);
  });

  it("jumps forward to a later era by id", () => {
    const c = content(); // fixture eras: boyhood(0), mogul(1)
    const s = initState(c, "seed"); // starts in boyhood
    const next = applyJump(c, s, choice({ jumpTo: { era: "mogul" } }));
    expect(next.eraIndex).toBe(1);
    expect(next.year).toBeGreaterThanOrEqual(1964); // mogul yearStart
    expect(next.eraEventCount).toBe(0);
  });

  it("ignores a backward era hop (forward-only)", () => {
    const c = content();
    const s = { ...initState(c, "seed"), eraIndex: 1, year: 1970 };
    const next = applyJump(c, s, choice({ jumpTo: { era: "boyhood" } }));
    expect(next.eraIndex).toBe(1); // unchanged — no backward jump
  });

  it("advances by yearAdvance and never moves the floor backward", () => {
    const c = content();
    const s = initState(c, "seed"); // year 1946
    const next = applyJump(c, s, choice({ jumpTo: { yearAdvance: 20 } }));
    expect(next.year).toBe(1966);
    expect(next.lastEventYear).toBeGreaterThanOrEqual(next.year - 0);
  });
});

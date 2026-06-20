import { describe, expect, it } from "vitest";
import endingsJson from "../../data/endings.json";
import { buildContent, type Content } from "../content";
import { evaluateEnding } from "../endings";
import { initState } from "../state";
import { validRaw } from "./fixtures";

// Build content carrying the REAL authored endings so we exercise the shipped
// gates, not a fixture stand-in. The fixture eras only reach order 1, so append
// a synthetic order-12 era and aim the state at it — the endgame endings gate on
// minEraOrder 7-12 and evaluateEnding reads the active era's `order`.
const built = buildContent({ ...validRaw(), endings: endingsJson });
const lastEra = built.eras[built.eras.length - 1];
if (!lastEra) throw new Error("fixture has no eras");
const lateEra = { ...lastEra, id: "interstellar", order: 12 };
const content: Content = { ...built, eras: [...built.eras, lateEra] };

// A late-era state we can layer flags/personality/meters onto.
function lateState(over: Partial<ReturnType<typeof initState>> = {}) {
  const s = initState(content, "seed");
  return { ...s, eraIndex: content.eras.length - 1, year: 2120, age: 174, ...over };
}

// Content whose active era is order 7 (the victory era) — used to prove the
// Earth-bound endgame endings do NOT pre-empt a player on the science ladder.
const order7Era = { ...lateEra, id: "victory", order: 7 };
const content7: Content = { ...built, eras: [...built.eras, order7Era] };
function era7State(over: Partial<ReturnType<typeof initState>> = {}) {
  const s = initState(content7, "seed");
  return { ...s, eraIndex: content7.eras.length - 1, year: 2024, age: 78, ...over };
}

describe("data-driven endings — role-flip & world-aligned outcomes", () => {
  it("fires the role-flip tycoon ending when Musk is president and Trump went commercial", () => {
    const s = lateState({ flags: ["role_flip", "trump_commercial_path"].sort() });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_role_flip_tycoon");
  });

  it("fires the Reich-industrialist ending in the Axis world with Trump commercial", () => {
    const s = lateState({ flags: ["axis_ascendant", "trump_commercial_path"].sort() });
    // priority 92 outranks the generic tycoon (78), and the role-flip ending is
    // excluded in the Axis world via its notFlags.
    expect(evaluateEnding(content, s)?.endingId).toBe("end_reich_industrialist");
  });

  it("prefers the world-aligned utopia when the age itself turned collectivist", () => {
    const base = lateState();
    const s = {
      ...base,
      flags: ["utopian_currents"],
      personality: { ideology: -70, grandiosity: 50, outward: 0, inward: 0 },
      meters: { ...base.meters, reputation: 70 },
    };
    // The aligned variant (priority 90) beats the personality-only one (88).
    expect(evaluateEnding(content, s)?.endingId).toBe("end_communist_utopia_aligned");
  });

  it("prefers the world-aligned tyranny when the age itself turned autocratic", () => {
    const base = lateState();
    const s = {
      ...base,
      flags: ["autocratic_currents"],
      personality: { ideology: 70, grandiosity: 90, outward: 0, inward: 0 },
      meters: { ...base.meters, power: 90 },
    };
    expect(evaluateEnding(content, s)?.endingId).toBe("end_megalomaniac_king_aligned");
  });

  it("falls back to the personality-only utopia when the world has not aligned", () => {
    const base = lateState();
    const s = {
      ...base,
      flags: [],
      personality: { ideology: -70, grandiosity: 50, outward: 0, inward: 0 },
      meters: { ...base.meters, reputation: 70 },
    };
    expect(evaluateEnding(content, s)?.endingId).toBe("end_communist_utopia");
  });

  it("does NOT pre-empt a science-ladder player with the Earth-bound tyrant ending at era 7", () => {
    // A god-king on the Mars program must keep going toward the stars, not end
    // on Earth at the victory era. The notFlags gate is the science-path escape.
    const base = era7State();
    const s = {
      ...base,
      flags: ["mars_program"],
      personality: { ideology: 70, grandiosity: 90, outward: 0, inward: 0 },
      meters: { ...base.meters, power: 90 },
    };
    expect(evaluateEnding(content7, s)?.endingId).not.toBe("end_megalomaniac_king");
  });

  it("still ends the Earth-bound tyrant on the no-science path at era 7", () => {
    const base = era7State();
    const s = {
      ...base,
      flags: [],
      personality: { ideology: 70, grandiosity: 90, outward: 0, inward: 0 },
      meters: { ...base.meters, power: 90 },
    };
    expect(evaluateEnding(content7, s)?.endingId).toBe("end_megalomaniac_king");
  });
});

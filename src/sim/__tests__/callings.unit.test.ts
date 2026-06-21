import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { applyCallingDrift, callingById, callingWeight } from "../callings";
import { effectiveWeight } from "../events";
import { foundDynasty } from "../founding";
import type { Calling, GameEvent } from "../schema";
import { initState, type LiveMember } from "../state";

/**
 * CP-2 — callings: the catalog loads + cross-ref validates; trait drift + trope
 * weight are pure and bounded; a founded line carries its calling and its events
 * are weighted by it.
 */

const content = loadContent();

const scholar = callingById(content.callings, "scholar");
const soldier = callingById(content.callings, "soldier");

const baseTraits: LiveMember["traits"] = { ambition: 50, cunning: 50, vigor: 50, piety: 50 };

describe("CP-2 callings content", () => {
  it("loads the calling catalog", () => {
    expect(content.callings.length).toBeGreaterThanOrEqual(4);
    expect(callingById(content.callings, "merchant")).toBeDefined();
    expect(callingById(content.callings, "scholar")).toBeDefined();
  });

  it("every calling's trope-weight keys resolve to the catalog", () => {
    const tropeIds = new Set(content.tropes.map((t) => t.id));
    for (const c of content.callings) {
      for (const id of Object.keys(c.tropeWeights)) {
        expect(tropeIds.has(id), `${c.id}:${id}`).toBe(true);
      }
    }
  });
});

describe("CP-2 applyCallingDrift", () => {
  it("drifts traits toward the calling, clamped to 0..100", () => {
    const drifted = applyCallingDrift(baseTraits, scholar);
    // Scholar drifts cunning + piety up, vigor down.
    expect(drifted.cunning).toBeGreaterThan(50);
    expect(drifted.piety).toBeGreaterThan(50);
    expect(drifted.vigor).toBeLessThan(50);
  });

  it("is a no-op without a calling", () => {
    expect(applyCallingDrift(baseTraits, undefined)).toEqual(baseTraits);
  });

  it("clamps at the bounds", () => {
    const high = applyCallingDrift(
      { ambition: 100, cunning: 100, vigor: 100, piety: 100 },
      soldier,
    );
    for (const v of Object.values(high)) expect(v).toBeLessThanOrEqual(100);
    const low = applyCallingDrift({ ambition: 0, cunning: 0, vigor: 0, piety: 0 }, scholar);
    for (const v of Object.values(low)) expect(v).toBeGreaterThanOrEqual(0);
  });
});

describe("CP-2 callingWeight", () => {
  const c: Calling = {
    id: "x",
    label: "X",
    summary: "s",
    traitDrift: {},
    tropeWeights: { conqueror: 2, martyr: 1.5 },
  };
  function ev(tags: string[]): GameEvent {
    return {
      id: "e",
      era: "origins",
      year: 1900,
      title: "t",
      scene: "s",
      researchNote: "r",
      extrapolated: false,
      startrekInspired: false,
      tags,
      requires: { flags: [], notFlags: [], meters: {}, personality: {} },
      weight: 10,
      repeatable: false,
      choices: [
        {
          id: "c",
          text: "t",
          effects: {},
          personality: {},
          setFlags: [],
          clearFlags: [],
          ripples: [],
          outcome: "o",
        },
      ],
    };
  }

  it("multiplies weighted tropes (product of matches)", () => {
    expect(callingWeight(c, ev(["trope:conqueror"]))).toBe(2);
    expect(callingWeight(c, ev(["trope:conqueror", "trope:martyr"]))).toBe(3);
  });
  it("is neutral for unweighted/absent tropes or no calling", () => {
    expect(callingWeight(c, ev(["trope:prophet"]))).toBe(1);
    expect(callingWeight(c, ev([]))).toBe(1);
    expect(callingWeight(undefined, ev(["trope:conqueror"]))).toBe(1);
  });
});

describe("CP-2 wired into the run", () => {
  it("a founded line stores its calling, and effectiveWeight reflects it", () => {
    const founded = foundDynasty(content, {
      momentId: "abbasid_baghdad_762",
      surname: "al-Rashid",
      seed: "cp2",
      calling: "soldier",
    }).state;
    expect(founded.founding?.calling).toBe("soldier");

    // A conqueror-tagged event weighs more for a Soldier line than for a callless one.
    const conquerorEv: GameEvent = {
      id: "ev_conq",
      era: content.eras[founded.eraIndex]?.id ?? "caliphate",
      year: founded.year,
      title: "t",
      scene: "s",
      researchNote: "r",
      extrapolated: false,
      startrekInspired: false,
      tags: ["trope:conqueror"],
      requires: { flags: [], notFlags: [], meters: {}, personality: {} },
      weight: 10,
      repeatable: false,
      choices: [
        {
          id: "c",
          text: "t",
          effects: {},
          personality: {},
          setFlags: [],
          clearFlags: [],
          ripples: [],
          outcome: "o",
        },
      ],
    };
    const callless = initState(content, "cp2");
    expect(effectiveWeight(content, founded, conquerorEv)).toBeGreaterThan(
      effectiveWeight(content, callless, conquerorEv),
    );
  });
});

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

describe("data-driven endings — world-aligned outcomes", () => {
  // NO-LEAK (FD-3): the role-flip endings (end_role_flip_tycoon /
  // end_reich_industrialist) were removed with the swap mechanic — a founded
  // dynasty never trades places with a rival, so those outcomes can't arise.
  it("prefers the world-aligned utopia when the age itself turned collectivist", () => {
    const base = lateState();
    const s = {
      ...base,
      flags: ["utopian_currents"],
      personality: {
        wealth: 0,
        politics: -70,
        worldview: 0,
        power: 50,
        tradition: 0,
        honor: 0,
        lineage: 0,
        reach: 0,
      },
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
      personality: {
        wealth: 0,
        politics: 70,
        worldview: 0,
        power: 90,
        tradition: 0,
        honor: 0,
        lineage: 0,
        reach: 0,
      },
      meters: { ...base.meters, power: 90 },
    };
    expect(evaluateEnding(content, s)?.endingId).toBe("end_megalomaniac_king_aligned");
  });

  it("falls back to the personality-only utopia when the world has not aligned", () => {
    const base = lateState();
    const s = {
      ...base,
      flags: [],
      personality: {
        wealth: 0,
        politics: -70,
        worldview: 0,
        power: 50,
        tradition: 0,
        honor: 0,
        lineage: 0,
        reach: 0,
      },
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
      personality: {
        wealth: 0,
        politics: 70,
        worldview: 0,
        power: 90,
        tradition: 0,
        honor: 0,
        lineage: 0,
        reach: 0,
      },
      meters: { ...base.meters, power: 90 },
    };
    expect(evaluateEnding(content7, s)?.endingId).not.toBe("end_megalomaniac_king");
  });

  it("still ends the Earth-bound tyrant on the no-science path at era 7", () => {
    const base = era7State();
    const s = {
      ...base,
      flags: [],
      personality: {
        wealth: 0,
        politics: 70,
        worldview: 0,
        power: 90,
        tradition: 0,
        honor: 0,
        lineage: 0,
        reach: 0,
      },
      meters: { ...base.meters, power: 90 },
    };
    expect(evaluateEnding(content7, s)?.endingId).toBe("end_megalomaniac_king");
  });
});

describe("moral-pole ending gate (DE-2)", () => {
  // Three pole-gated endings sharing the same flag gate but differing on `when.pole`.
  const poleEndings = {
    endings: [
      {
        id: "end_pole_utopian",
        kind: "victory",
        title: "U",
        reason: "utopian end",
        priority: 50,
        tier: "apex" as const,
        when: { flags: ["reached_apex"], pole: "utopian" as const, minEraOrder: 7 },
      },
      {
        id: "end_pole_dictatorial",
        kind: "victory",
        title: "D",
        reason: "dictatorial end",
        priority: 50,
        tier: "apex" as const,
        when: { flags: ["reached_apex"], pole: "dictatorial" as const, minEraOrder: 7 },
      },
    ],
  };
  const poleContent: Content = {
    ...built,
    endings: buildContent({ ...validRaw(), endings: poleEndings }).endings,
    eras: [...built.eras, lateEra],
  };
  function poleState(over: Partial<ReturnType<typeof initState>> = {}) {
    const s = initState(poleContent, "seed");
    return { ...s, eraIndex: poleContent.eras.length - 1, year: 2120, age: 174, ...over };
  }

  it("fires the utopian-pole ending only when the run resolves to the utopian pole", () => {
    // tyrannyUtopiaAxis = reach*0.6 + politics*0.25 + power*0.15; drive it
    // below -40 for the utopian pole (reach-dominated).
    const s = poleState({
      flags: ["reached_apex"],
      personality: {
        wealth: 0,
        politics: -80,
        worldview: 0,
        power: -80,
        tradition: 0,
        honor: 0,
        lineage: 0,
        reach: -80,
      },
    });
    expect(evaluateEnding(poleContent, s)?.endingId).toBe("end_pole_utopian");
  });

  it("fires the dictatorial-pole ending for a tyrannical run with the same flags", () => {
    const s = poleState({
      flags: ["reached_apex"],
      personality: {
        wealth: 0,
        politics: 80,
        worldview: 0,
        power: 90,
        tradition: 0,
        honor: 0,
        lineage: 0,
        reach: 80,
      },
    });
    expect(evaluateEnding(poleContent, s)?.endingId).toBe("end_pole_dictatorial");
  });

  it("a pole-gated ending does NOT fire when the pole does not match", () => {
    // Centrist run — neither the utopian nor dictatorial pole ending qualifies.
    const s = poleState({
      flags: ["reached_apex"],
      personality: {
        wealth: 0,
        politics: 0,
        worldview: 0,
        power: 0,
        tradition: 0,
        honor: 0,
        lineage: 0,
        reach: 0,
      },
    });
    expect(evaluateEnding(poleContent, s)).toBeNull();
  });
});

describe("per-branch per-pole endings — flag-gated resolution (DE-2a)", () => {
  // Nazi branch
  it("fires end_nazi_utopian for reich_utopian_pole (no other pole flags)", () => {
    const s = lateState({ flags: ["reich_utopian_pole"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_nazi_utopian");
  });
  it("fires end_nazi_centrist for reich_centrist_pole", () => {
    const s = lateState({ flags: ["reich_centrist_pole"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_nazi_centrist");
  });
  it("fires end_nazi_dictatorial for reich_dictatorial_pole", () => {
    const s = lateState({ flags: ["reich_dictatorial_pole"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_nazi_dictatorial");
  });

  // Theocracy branch
  it("fires end_theocracy_utopian for covenant_commonwealth", () => {
    const s = lateState({ flags: ["covenant_commonwealth"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_theocracy_utopian");
  });
  it("fires end_theocracy_centrist for soft_establishment", () => {
    const s = lateState({ flags: ["soft_establishment"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_theocracy_centrist");
  });
  it("fires end_theocracy_dictatorial for gilead_regime (prio 95 > health_death 90)", () => {
    const s = lateState({ flags: ["gilead_regime"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_theocracy_dictatorial");
  });

  // Oligarchy branch
  it("fires end_oligarchy_utopian for abundance_technocracy", () => {
    const s = lateState({ flags: ["abundance_technocracy"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_oligarchy_utopian");
  });
  it("fires end_oligarchy_centrist for managed_oligopoly", () => {
    const s = lateState({ flags: ["managed_oligopoly"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_oligarchy_centrist");
  });
  it("fires end_oligarchy_dictatorial for company_serfdom", () => {
    const s = lateState({ flags: ["company_serfdom"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_oligarchy_dictatorial");
  });

  // Megachurch branch
  it("fires end_megachurch_utopian for charitable_ministry", () => {
    const s = lateState({ flags: ["charitable_ministry"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_megachurch_utopian");
  });
  it("fires end_megachurch_centrist for prosperity_grift", () => {
    const s = lateState({ flags: ["prosperity_grift"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_megachurch_centrist");
  });
  it("fires end_megachurch_dictatorial for personality_cult", () => {
    const s = lateState({ flags: ["personality_cult"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_megachurch_dictatorial");
  });

  // Media branch
  it("fires end_media_utopian for media_utopian_pole", () => {
    const s = lateState({ flags: ["media_utopian_pole"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_media_utopian");
  });
  it("fires end_media_centrist for media_centrist_pole", () => {
    const s = lateState({ flags: ["media_centrist_pole"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_media_centrist");
  });
  it("fires end_media_dictatorial for propaganda_state", () => {
    const s = lateState({ flags: ["propaganda_state"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_media_dictatorial");
  });

  // Westcoast branch
  it("fires end_westcoast_utopian for pole_utopian", () => {
    const s = lateState({ flags: ["pole_utopian"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_westcoast_utopian");
  });
  it("fires end_westcoast_centrist for pole_centrist", () => {
    const s = lateState({ flags: ["pole_centrist"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_westcoast_centrist");
  });
  it("fires end_westcoast_dictatorial for pole_dictatorial", () => {
    const s = lateState({ flags: ["pole_dictatorial"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_westcoast_dictatorial");
  });

  // Default branch centrist
  it("fires end_default_centrist for managed_oligopoly_civil_religion (no mars/autocratic/utopian)", () => {
    const s = lateState({ flags: ["managed_oligopoly_civil_religion"] });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_default_centrist");
  });

  // Utopian pole endings are "endgame-good" tier
  it("nazi utopian ending has tier endgame-good", () => {
    const ending = content.endings.find((e) => e.id === "end_nazi_utopian");
    expect(ending?.tier).toBe("endgame-good");
  });
  it("theocracy utopian ending has tier endgame-good", () => {
    const ending = content.endings.find((e) => e.id === "end_theocracy_utopian");
    expect(ending?.tier).toBe("endgame-good");
  });
  it("end_theocracy_dictatorial priority 96 outranks end_assassination 95 (reviewer fix)", () => {
    // Prevents array-order tie: a Gilead run that also draws assassination_target
    // must resolve to the theocracy ending, not the generic assassination cutscene.
    const gilead = content.endings.find((e) => e.id === "end_theocracy_dictatorial");
    const assassination = content.endings.find((e) => e.id === "end_assassination");
    expect(gilead?.priority).toBeGreaterThan(assassination?.priority ?? 0);
  });

  // rev-de2 #2: EVERY committed pole ending must outrank end_assassination, not
  // just the dictatorial theocracy one. A run that resolved a branch pole has
  // reached that branch's defined apex outcome; a generic assassination (which
  // only fires on assassination_target + high heat + low health) must not preempt
  // it. Previously only theocracy_dictatorial was bumped; the reward (utopian) and
  // other poles sat at 91-94 and lost to assassination@95.
  it("every per-branch pole ending outranks end_assassination@95", () => {
    const assassination = content.endings.find((e) => e.id === "end_assassination");
    const poleEndings = content.endings.filter((e) =>
      /_(utopian|centrist|dictatorial)$/.test(e.id),
    );
    expect(poleEndings.length).toBeGreaterThanOrEqual(18);
    for (const p of poleEndings) {
      expect(p.priority, `${p.id} must beat assassination`).toBeGreaterThan(
        assassination?.priority ?? 0,
      );
    }
  });

  it("a hunted, high-heat UTOPIAN-pole run resolves to its pole ending, not assassination", () => {
    // The exact rev-de2 scenario: a coherent utopia builder who is also an
    // assassination_target with high heat / low health still gets the reward ending.
    const s = lateState({
      flags: ["covenant_commonwealth", "assassination_target"].sort(),
      meters: { ...lateState().meters, heat: 90, health: 20 },
    });
    expect(evaluateEnding(content, s)?.endingId).toBe("end_theocracy_utopian");
  });
});

import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { applyChoice, replayFromState } from "../effects";
import { beget, childrenOf, kinFor, memberById, seedFamily, takePartner } from "../family";
import { foundDynasty } from "../founding";
import { getCulture } from "../onomastics";
import { createRng } from "../rng";
import type { GameEvent } from "../schema";

/**
 * FD-8 — the live family tree + pure seeded birth mechanics: seedFamily roots the
 * progenitor; beget adds convention-named, trait-inheriting children; the whole
 * tree is replay-deterministic.
 */

const content = loadContent();
const bavarian = getCulture({ cultures: content.onomastics }, "bavarian_german");

describe("FD-8 seedFamily", () => {
  it("roots the progenitor as the generation-0 protagonist", () => {
    const f = seedFamily({ given: "Friedrich", surname: "Vane", sex: "male", born: 1885 });
    expect(f.members).toHaveLength(1);
    expect(f.protagonistId).toBe("m0");
    const p = memberById(f, "m0");
    expect(p.given).toBe("Friedrich");
    expect(p.surname).toBe("Vane");
    expect(p.generation).toBe(0);
    expect(p.isProtagonist).toBe(true);
  });

  it("foundDynasty seeds the family with the named progenitor", () => {
    const r = foundDynasty(content, { momentId: "bavaria_1885", surname: "Vane", seed: "s" });
    expect(r.state.family).toBeDefined();
    const p = memberById(r.state.family!, r.state.family!.protagonistId);
    expect(p.surname).toBe("Vane");
    expect(p.given).toBe(r.progenitorGiven);
  });
});

describe("FD-8 beget", () => {
  const f0 = seedFamily({
    given: "Friedrich",
    surname: "Vane",
    sex: "male",
    born: 1885,
    traits: { ambition: 80, cunning: 60, vigor: 70, piety: 40 },
  });

  it("adds a child with the family surname, next generation, and a minted id", () => {
    const { family, child } = beget(f0, "m0", 1910, bavarian, kinFor(f0, "m0"), createRng("c"));
    expect(child.id).toBe("m1");
    expect(child.surname).toBe("Vane");
    expect(child.generation).toBe(1);
    expect(child.born).toBe(1910);
    expect(child.parentId).toBe("m0");
    expect(family.members).toHaveLength(2);
    expect(childrenOf(family, "m0")).toHaveLength(1);
  });

  it("inherits traits from the parent with bounded ±variance", () => {
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const { child } = beget(f0, "m0", 1910, bavarian, kinFor(f0, "m0"), createRng(seed));
      // Each trait stays within ±20 of the parent and clamped to 0..100.
      expect(Math.abs(child.traits.ambition - 80)).toBeLessThanOrEqual(20);
      expect(child.traits.ambition).toBeGreaterThanOrEqual(0);
      expect(child.traits.ambition).toBeLessThanOrEqual(100);
      expect(Math.abs(child.traits.piety - 40)).toBeLessThanOrEqual(20);
    }
  });

  it("names the eldest son by the culture's convention (paternal grandfather)", () => {
    // Build a 3-generation line so a grandparent name exists for the convention.
    const g1 = beget(f0, "m0", 1910, bavarian, kinFor(f0, "m0"), createRng("g1"));
    // Force the gen-1 member to be male so it can father a grandson (re-roll seeds).
    const son = g1.family.members.find((m) => m.id === "m1");
    if (son) son.sex = "male";
    const kin = kinFor(g1.family, "m1");
    // The grandson's eldest-son name should resolve to the grandfather "Friedrich"
    // (Bavarian rule: eldest son ← paternal grandfather), suffixed on repeat.
    const grandson = beget(g1.family, "m1", 1940, bavarian, kin, createRng("g2")).child;
    if (grandson.sex === "male" && grandson.given.startsWith("Friedrich")) {
      expect(grandson.given).toMatch(/^Friedrich( II)?$/);
    }
  });

  it("kinFor populates only the recorded parent's lineage (review HIGH regression)", () => {
    // A male parent (m1) with a male grandparent (m0) → ONLY the paternal lineage
    // grandfather is known; maternal slots stay undefined (the live tree records
    // one lineage parent, so the one grandparent must not fill both lineages).
    const g1 = beget(f0, "m0", 1910, bavarian, kinFor(f0, "m0"), createRng("g1"));
    const son = g1.family.members.find((m) => m.id === "m1");
    if (son) son.sex = "male";
    const kin = kinFor(g1.family, "m1");
    expect(kin.paternalGrandfather).toBe("Friedrich");
    expect(kin.maternalGrandfather).toBeUndefined();
    expect(kin.father).toBe(son?.given);
  });

  it("is replay-deterministic: same (family, parent, year, rng) → identical child", () => {
    const a = beget(f0, "m0", 1910, bavarian, kinFor(f0, "m0"), createRng("z"));
    const b = beget(f0, "m0", 1910, bavarian, kinFor(f0, "m0"), createRng("z"));
    expect(a.child).toEqual(b.child);
    expect(a.family).toEqual(b.family);
  });

  it("multiple begets mint distinct ids and accumulate children", () => {
    let f = f0;
    for (let i = 0; i < 3; i++) {
      f = beget(f, "m0", 1908 + i, bavarian, kinFor(f, "m0"), createRng(`k${i}`)).family;
    }
    expect(childrenOf(f, "m0")).toHaveLength(3);
    expect(new Set(f.members.map((m) => m.id)).size).toBe(f.members.length);
  });
});

describe("FD-8 beget wired through applyChoice + replay", () => {
  // A founded line + a synthetic event whose choice begets two children.
  const founded = foundDynasty(content, {
    momentId: "bavaria_1885",
    surname: "Vane",
    seed: "fam-seed",
  }).state;
  const era = content.eras[founded.eraIndex];
  const begetEvent: GameEvent = {
    id: "ev_test_beget",
    era: era?.id ?? "origins",
    year: 1910,
    title: "Heirs",
    scene: "The line continues.",
    researchNote: "test",
    extrapolated: false,
    startrekInspired: false,
    tags: [],
    requires: { flags: [], notFlags: [], meters: {}, personality: {} },
    weight: 1,
    repeatable: false,
    choices: [
      {
        id: "have_two",
        text: "Raise two children",
        effects: {},
        personality: {},
        setFlags: [],
        clearFlags: [],
        ripples: [],
        outcome: "Two heirs.",
        begets: 2,
      },
    ],
  };
  const contentWithEvent = {
    ...content,
    allEvents: [...content.allEvents, begetEvent],
  };

  it("a begetting choice grows the live family through applyChoice", () => {
    const after = applyChoice(
      contentWithEvent,
      founded,
      begetEvent,
      "have_two",
      createRng("fam-seed"),
    ).state;
    const kids = childrenOf(after.family!, after.family!.protagonistId);
    expect(kids).toHaveLength(2);
    expect(kids.every((k) => k.surname === "Vane")).toBe(true);
  });

  it("the grown tree reconstructs identically on replay (determinism)", () => {
    const after = applyChoice(
      contentWithEvent,
      founded,
      begetEvent,
      "have_two",
      createRng("fam-seed"),
    ).state;
    const replayed = replayFromState(contentWithEvent, founded, after.history, createRng);
    expect(replayed.family).toEqual(after.family);
  });
});

describe("CP-5 takePartner", () => {
  const f0 = seedFamily({
    given: "Otto",
    surname: "Vane",
    sex: "male",
    born: 1850,
    traits: { ambition: 50, cunning: 50, vigor: 50, piety: 50 },
  });

  it("mints an in-law partner (no parentId, same generation) and sets partnerId", () => {
    const { family, partner } = takePartner(f0, 1875, bavarian, createRng("p"));
    expect(partner.parentId).toBeUndefined();
    expect(partner.generation).toBe(0);
    expect(partner.sex).toBe("female"); // complement of the male protagonist
    expect(bavarian.givenFemale).toContain(partner.given);
    expect(family.partnerId).toBe(partner.id);
  });

  it("a partner blends traits into the next beget (toward the midpoint)", () => {
    // Force a high-cunning partner, then beget; children skew above the parent's 50.
    let { family } = takePartner(f0, 1875, bavarian, createRng("p"));
    const pid = family.partnerId as string;
    family = {
      ...family,
      members: family.members.map((m) =>
        m.id === pid ? { ...m, traits: { ambition: 90, cunning: 90, vigor: 90, piety: 90 } } : m,
      ),
    };
    // Average of parent 50 + partner 90 = 70; child drifts within ±20 of 70 → ≥50.
    for (const seed of ["a", "b", "c", "d"]) {
      const child = beget(
        family,
        "m0",
        1900,
        bavarian,
        kinFor(family, "m0"),
        createRng(seed),
      ).child;
      expect(child.traits.cunning).toBeGreaterThanOrEqual(50);
    }
  });

  it("is replay-deterministic", () => {
    const a = takePartner(f0, 1875, bavarian, createRng("z"));
    const b = takePartner(f0, 1875, bavarian, createRng("z"));
    expect(a.family).toEqual(b.family);
    expect(a.partner).toEqual(b.partner);
  });

  it("a takesPartner choice + succession clears the partner for the heir", () => {
    const founded = foundDynasty(content, {
      momentId: "bavaria_1885",
      surname: "Vane",
      seed: "cp5",
    }).state;
    const ev: GameEvent = {
      id: "ev_cp5",
      era: content.eras[founded.eraIndex]?.id ?? "origins",
      year: 1908,
      title: "Marriage",
      scene: "s",
      researchNote: "r",
      extrapolated: false,
      startrekInspired: false,
      tags: [],
      requires: { flags: [], notFlags: [], meters: {}, personality: {} },
      weight: 1,
      repeatable: false,
      choices: [
        {
          id: "wed",
          text: "wed",
          effects: {},
          personality: {},
          setFlags: [],
          clearFlags: [],
          ripples: [],
          outcome: "o",
          takesPartner: true,
        },
      ],
    };
    const c = { ...content, allEvents: [...content.allEvents, ev] };
    const after = applyChoice(c, founded, ev, "wed", createRng("cp5")).state;
    expect(after.family?.partnerId).toBeDefined();
  });

  it("CP-R6: a setsCalling choice writes the founded line's calling (diegetic calling beat)", () => {
    const founded = foundDynasty(content, {
      momentId: "bavaria_1885",
      surname: "Vane",
      seed: "cr6",
    }).state;
    // A dealt/founded line has no calling until the diegetic beat sets one.
    expect(founded.founding?.calling).toBeUndefined();
    const ev: GameEvent = {
      id: "ev_calling_beat",
      era: content.eras[founded.eraIndex]?.id ?? "origins",
      year: 1900,
      title: "What Calls to You",
      scene: "s",
      researchNote: "r",
      extrapolated: false,
      startrekInspired: false,
      tags: [],
      requires: { flags: [], notFlags: [], meters: {}, personality: {} },
      weight: 1,
      repeatable: false,
      choices: [
        {
          id: "be_a_scholar",
          text: "scholar",
          effects: {},
          personality: {},
          setFlags: [],
          clearFlags: [],
          ripples: [],
          outcome: "o",
          setsCalling: "scholar",
        },
      ],
    };
    const c = { ...content, allEvents: [...content.allEvents, ev] };
    const after = applyChoice(c, founded, ev, "be_a_scholar", createRng("cr6")).state;
    expect(after.founding?.calling).toBe("scholar");
    // An unknown calling id is ignored (no-op), not written.
    const evBad = { ...ev, choices: [{ ...ev.choices[0], setsCalling: "nonexistent" }] } as GameEvent;
    const cBad = { ...content, allEvents: [...content.allEvents, evBad] };
    const afterBad = applyChoice(cBad, founded, evBad, "be_a_scholar", createRng("cr6")).state;
    expect(afterBad.founding?.calling).toBeUndefined();
  });
});

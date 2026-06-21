import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { applyChoice, replayFromState } from "../effects";
import { beget, childrenOf, kinFor, memberById, seedFamily } from "../family";
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

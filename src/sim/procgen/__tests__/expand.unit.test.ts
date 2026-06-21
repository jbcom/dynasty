import { describe, expect, it } from "vitest";
import { createRng } from "../../rng";
import { EventSchema, EventTemplateSchema, parseContent } from "../../schema";
import { type ExpandContext, expandTemplate } from "../index";

/**
 * FD-4 — the pure seeded template expander. Tests the load-bearing invariant
 * (determinism: same seed → identical event), slot substitution, ranged-delta
 * draws staying within authored bounds, and trope-tag emission.
 */

const TEMPLATE = parseContent(
  EventTemplateSchema,
  {
    id: "rival_gambit",
    era: "mogul",
    title: "{member} vs {rival} in {place}",
    scene:
      "In {year}, {member} faces {peril} while {rival} circles. The {surname} name is on the line.",
    slots: ["member", "rival", "place", "year", "peril", "surname"],
    tropes: ["cadet-branch", "scandal-fall-rehab"],
    tags: ["family"],
    weight: 7,
    choices: [
      {
        id: "fight",
        text: "{member} fights back",
        outcome: "The {surname} line holds — for now.",
        effects: { money: { min: -50, max: 50 }, heat: { min: 0, max: 20 } },
        personality: { power: { min: 1, max: 10 } },
        setFlags: ["fought_rival"],
      },
      {
        id: "yield",
        text: "{member} yields to {rival}",
        outcome: "A humiliation in {place}.",
      },
    ],
  },
  "template",
);

const CTX: ExpandContext = {
  member: "Conrad",
  rival: "Edmund",
  place: "Manhattan",
  year: 1985,
  perils: ["a hostile takeover", "a bankruptcy filing"],
  tropeLabel: "The Cadet Branch",
  surname: "Vane",
  era: "mogul",
};

describe("FD-4 expandTemplate", () => {
  it("is deterministic: same seed → identical event", () => {
    const a = expandTemplate(TEMPLATE, CTX, createRng("seed-1"));
    const b = expandTemplate(TEMPLATE, CTX, createRng("seed-1"));
    expect(a).toEqual(b);
  });

  it("different seeds diverge (id and/or drawn deltas)", () => {
    const a = expandTemplate(TEMPLATE, CTX, createRng("seed-1"));
    const b = expandTemplate(TEMPLATE, CTX, createRng("seed-2"));
    expect(a).not.toEqual(b);
  });

  it("substitutes every slot token in title/scene/choices", () => {
    const ev = expandTemplate(TEMPLATE, CTX, createRng("seed-1"));
    expect(ev.title).toBe("Conrad vs Edmund in Manhattan");
    expect(ev.scene).toContain("In 1985");
    expect(ev.scene).toContain("Vane name is on the line");
    // peril resolves to one of the authored perils
    expect(["a hostile takeover", "a bankruptcy filing"].some((p) => ev.scene.includes(p))).toBe(
      true,
    );
    expect(ev.title).not.toMatch(/\{.*\}/);
    expect(ev.scene).not.toMatch(/\{.*\}/);
    for (const c of ev.choices) {
      expect(c.text).not.toMatch(/\{.*\}/);
      expect(c.outcome).not.toMatch(/\{.*\}/);
    }
  });

  it("draws ranged deltas within the authored bounds", () => {
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const ev = expandTemplate(TEMPLATE, CTX, createRng(seed));
      const fight = ev.choices.find((c) => c.id === "fight");
      expect(fight?.effects.money).toBeGreaterThanOrEqual(-50);
      expect(fight?.effects.money).toBeLessThanOrEqual(50);
      expect(fight?.effects.heat).toBeGreaterThanOrEqual(0);
      expect(fight?.effects.heat).toBeLessThanOrEqual(20);
      expect(fight?.personality.power).toBeGreaterThanOrEqual(1);
      expect(fight?.personality.power).toBeLessThanOrEqual(10);
    }
  });

  it("emits trope:<id> tags + a 'procedural' marker tag", () => {
    const ev = expandTemplate(TEMPLATE, CTX, createRng("seed-1"));
    expect(ev.tags).toContain("trope:cadet-branch");
    expect(ev.tags).toContain("trope:scandal-fall-rehab");
    expect(ev.tags).toContain("procedural");
    expect(ev.tags).toContain("family");
  });

  it("stamps the right era/year/place and carries choices through", () => {
    const ev = expandTemplate(TEMPLATE, CTX, createRng("seed-1"));
    expect(ev.era).toBe("mogul");
    expect(ev.year).toBe(1985);
    expect(ev.place).toBe("Manhattan");
    expect(ev.choices.map((c) => c.id)).toEqual(["fight", "yield"]);
    expect(ev.choices[0]?.setFlags).toEqual(["fought_rival"]);
    expect(ev.id).toMatch(/^ev_proc_rival_gambit_1985_[a-z0-9]{6}$/);
  });

  it("falls back to 'ruin' when no perils are supplied", () => {
    const ev = expandTemplate(TEMPLATE, { ...CTX, perils: [] }, createRng("seed-1"));
    expect(ev.scene).toContain("ruin");
  });

  it("the generated event validates against the real EventSchema", () => {
    // The load-bearing guarantee: procedural output IS ordinary, valid content
    // (so it can drop into the pool + survive the content loader's gates).
    const ev = expandTemplate(TEMPLATE, CTX, createRng("seed-1"));
    expect(() => parseContent(EventSchema, ev, "generated")).not.toThrow();
  });
});

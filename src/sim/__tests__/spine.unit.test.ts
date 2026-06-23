import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import type { Rung } from "../classRung";
import { ARCHETYPES } from "../slots";
import { SPINE_TIERS, sceneSlotsFor, spineFor } from "../spine";

/**
 * The authored spine (bones GenAI fleshes) — Narrative Acts model: every wave×class×archetype cell
 * resolves a complete scaffold of titled acts whose SCENE slots GenAI writes into novel prose. The
 * spine is NOT the old Epoch-0 (birth → name → station → schooling → calling); it opens in the lived
 * moment and carries the act's tiered decisions.
 */

const content = loadContent();
const wavePlaces = content.places.filter((p) => p.kind !== "destination").map((p) => p.id);
const CLASSES: Rung[] = ["poor", "middle"];

describe("spine scaffold (scene-slot)", () => {
  it("a cell's spine spans all three macro-acts and the six reach tiers", () => {
    const spine = spineFor({ wave: "ireland", cls: "poor", archetype: "economic" });
    expect(spine.map((a) => a.tier)).toEqual(SPINE_TIERS);
    expect(new Set(spine.map((a) => a.macroAct))).toEqual(
      new Set(["convergence", "emergence", "ascension"]),
    );
  });

  it("acts are titled chapters (Act I — …) not life-arc quizzes", () => {
    for (const act of spineFor({ wave: "ireland", cls: "poor", archetype: "economic" })) {
      expect(act.title).toMatch(/^Act [IVX]+ — /);
    }
  });

  it("every (wave × class × archetype) cell resolves a complete, reachable scaffold", () => {
    for (const wave of wavePlaces) {
      for (const cls of CLASSES) {
        for (const archetype of ARCHETYPES) {
          const spine = spineFor({ wave, cls, archetype });
          expect(spine.length, `${wave}/${cls}/${archetype}`).toBe(SPINE_TIERS.length);
          const sceneIds = sceneSlotsFor({ wave, cls, archetype }).map((s) => s.id);
          expect(new Set(sceneIds).size).toBe(sceneIds.length); // no duplicate scene slots
          for (const act of spine) expect(act.scenes.length).toBeGreaterThanOrEqual(4);
        }
      }
    }
  });

  it("each act carries a major and a secondary decision (Suzerain tiering)", () => {
    for (const act of spineFor({ wave: "bavaria", cls: "middle", archetype: "political" })) {
      const tiers = act.scenes.map((s) => s.decision).filter(Boolean);
      expect(tiers, act.id).toContain("major");
      expect(tiers, act.id).toContain("secondary");
    }
  });

  it("the opening scene does NOT re-confirm when/where (no birth/station/calling slots)", () => {
    const slots = sceneSlotsFor({ wave: "italian", cls: "poor", archetype: "religious" });
    for (const s of slots) {
      expect(s.id).not.toMatch(/:birth$|:naming$|:station$|:schooling$|:calling$/);
    }
    // the opening intent must explicitly avoid re-stating when/where.
    const open = slots.find((s) => s.id.endsWith(":open"));
    expect(open?.intent).toContain("never re-stating when/where");
  });

  it("frames the arc SHAPE as structural movement, not a competing story arc (UQ-reconcile)", () => {
    // The hash-picked ArcShape governs FORM (pacing). The era's historical ARC (guidance.json) governs
    // MEANING. The intents must read the shape as movement ("this act moves as a …" / "<shape> movement"),
    // never as "a <shape> generation" (which collided with the guidance ARC and confused the model).
    const slots = sceneSlotsFor({ wave: "ireland", cls: "poor", archetype: "economic" });
    const open = slots.find((s) => s.id.endsWith(":open"));
    const close = slots.find((s) => s.id.endsWith(":close"));
    expect(open?.intent).toMatch(/this act moves as a /);
    expect(close?.intent).toMatch(/movement\) closes/);
    // The old collision phrasing must be gone everywhere.
    for (const s of slots) expect(s.intent).not.toMatch(/\bgeneration\b/);
  });

  it("scenes rotate the sensory frame so the chapter is felt through different lenses", () => {
    const senses = new Set(
      spineFor({ wave: "ireland", cls: "poor", archetype: "economic" })[0]?.scenes.map(
        (s) => s.sense,
      ),
    );
    expect(senses.size).toBeGreaterThanOrEqual(3);
  });
});

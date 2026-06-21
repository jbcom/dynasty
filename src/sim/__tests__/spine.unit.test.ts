import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import type { Rung } from "../classRung";
import { ARCHETYPES } from "../slots";
import { beatSlotsFor, SPINE_TIERS, spineFor } from "../spine";

/** SS-10 — the authored spine (bones GenAI fleshes): every wave×class×macro-act cell has a reachable scaffold. */

const content = loadContent();
const wavePlaces = content.places.filter((p) => p.kind !== "destination").map((p) => p.id);
const CLASSES: Rung[] = ["poor", "middle"];

describe("spine scaffold (SS-10)", () => {
  it("a cell's spine spans all three macro-acts and the six reach tiers", () => {
    const spine = spineFor({ wave: "ireland", cls: "poor", archetype: "economic" });
    expect(spine.map((a) => a.tier)).toEqual(SPINE_TIERS);
    expect(new Set(spine.map((a) => a.macroAct))).toEqual(
      new Set(["convergence", "emergence", "ascension"]),
    );
  });

  it("every (wave × class × archetype) cell resolves a complete, reachable scaffold", () => {
    for (const wave of wavePlaces) {
      for (const cls of CLASSES) {
        for (const archetype of ARCHETYPES) {
          const spine = spineFor({ wave, cls, archetype });
          // every tier present, every act has the full life-arc, ids unique.
          expect(spine.length, `${wave}/${cls}/${archetype}`).toBe(SPINE_TIERS.length);
          const beatIds = beatSlotsFor({ wave, cls, archetype }).map((b) => b.id);
          expect(new Set(beatIds).size).toBe(beatIds.length); // no duplicate beat slots
          for (const act of spine) expect(act.beats.length).toBeGreaterThanOrEqual(5);
        }
      }
    }
  });

  it("each act mixes EXPERIENCED and CHOSEN beats (a life lived, not a quiz)", () => {
    const beats =
      spineFor({ wave: "bavaria", cls: "middle", archetype: "political" })[0]?.beats ?? [];
    expect(beats.some((b) => b.register === "experienced")).toBe(true);
    expect(beats.some((b) => b.register === "chosen")).toBe(true);
    // the birth beat is always experienced (overhear the year — not a choice).
    expect(beats.find((b) => b.id.endsWith(":birth"))?.register).toBe("experienced");
  });

  it("the calling beat is chosen + present in every act (the archetype crystallizes each generation)", () => {
    for (const act of spineFor({ wave: "italian", cls: "poor", archetype: "religious" })) {
      const calling = act.beats.find((b) => b.id.endsWith(":calling"));
      expect(calling, act.id).toBeDefined();
      expect(calling?.register).toBe("chosen");
    }
  });
});

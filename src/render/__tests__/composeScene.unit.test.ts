import { describe, expect, it } from "vitest";
import { composeScene, type SceneRenderInput } from "../composeScene";

/**
 * RB-8 composeScene — the pure compositor core. Verifies: deterministic descriptors, the layered
 * portrait (base+tier+mood, not per-combination images), and the three trigger variants
 * (scene / rival silhouette / ending overlay) the design spec's use-case enumeration calls for.
 */

const baseInput: SceneRenderInput = {
  variant: "scene",
  archetype: "economic",
  cls: "poor",
  eraId: "origins",
  sense: "sight",
  pole: "ruthless",
};

describe("composeScene (RB-8)", () => {
  it("stacks a layered portrait — base(archetype) + tier(class) + mood(pole)", () => {
    const f = composeScene(baseInput);
    expect(f.layers.map((l) => l.role)).toEqual(["base", "tier", "mood"]);
    expect(f.layers[0]?.asset).toBe("portrait/base/economic");
    expect(f.layers[1]?.asset).toBe("portrait/tier/poor");
    expect(f.layers[2]?.asset).toBe("portrait/mood/ruthless");
    expect(f.silhouette).toBe(false);
  });

  it("carries the era wash + sense accent for a scene frame", () => {
    const f = composeScene(baseInput);
    expect(f.wash?.id).toBe("origins");
    expect(f.accent).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("is deterministic — same input yields an identical descriptor", () => {
    expect(composeScene(baseInput)).toEqual(composeScene(baseInput));
  });

  it("changes the cross-fade key when identity changes (drives SceneStage transitions)", () => {
    const a = composeScene(baseInput);
    const b = composeScene({ ...baseInput, eraId: "stars" });
    const c = composeScene({ ...baseInput, archetype: "political" });
    expect(a.key).not.toBe(b.key);
    expect(a.key).not.toBe(c.key);
  });

  it("slugifies a free-text pole into a bounded mood token", () => {
    const f = composeScene({ ...baseInput, pole: "Devout & Resolute!" });
    expect(f.layers.find((l) => l.role === "mood")?.asset).toBe("portrait/mood/devout-resolute");
    // No pole → neutral, never an empty asset id.
    expect(composeScene({ ...baseInput, pole: undefined }).layers[2]?.asset).toBe(
      "portrait/mood/neutral",
    );
  });

  describe("rival variant — reduced silhouette vignette", () => {
    it("is a single silhouette layer with no wash or accent", () => {
      const f = composeScene({
        variant: "rival",
        archetype: "athletic",
        cls: "middle",
        eraId: "mogul",
      });
      expect(f.silhouette).toBe(true);
      expect(f.layers).toHaveLength(1);
      expect(f.layers[0]?.asset).toBe("portrait/silhouette/athletic");
      expect(f.wash).toBeNull();
      expect(f.accent).toBeNull();
    });
  });

  describe("ending variant — portrait + outcome overlay", () => {
    it("appends an outcome layer over the full portrait", () => {
      const f = composeScene({ ...baseInput, variant: "ending", outcome: "stars" });
      expect(f.layers.map((l) => l.role)).toEqual(["base", "tier", "mood", "outcome"]);
      expect(f.layers[3]?.asset).toBe("portrait/outcome/stars");
      expect(f.wash?.id).toBe("origins");
    });

    it("requires an explicit outcome (the union forbids omitting it) and overlays it", () => {
      // The discriminated union makes `outcome` mandatory for an ending frame — omitting it is a
      // compile error, so the old runtime "default earthbound" path is gone. Each outcome maps through.
      for (const outcome of ["stars", "contributed", "earthbound", "extinguished"] as const) {
        const f = composeScene({ ...baseInput, variant: "ending", outcome });
        expect(f.layers[3]?.asset).toBe(`portrait/outcome/${outcome}`);
      }
    });
  });
});

import { describe, expect, it } from "vitest";
import { loadSaga } from "../../data/loadSaga";
import { initMotivators } from "../../sim/motivators";
import { ActChapterSchema, SceneSchema } from "../../sim/saga/schema";
import { SagaDriver } from "../sagaDriver";

/**
 * The saga driver bridges run-state → the novel: it selects a line's act from the corpus, walks it,
 * and yields the UI frame + carried motivators. When a cell has no authored act it yields a null
 * scene so the engine falls back to its event flow (partial content never breaks play).
 */

const corpus = loadSaga();

describe("SagaDriver", () => {
  it("begins the Ireland/economic tier-0 act and frames its opening scene (multi-paragraph)", () => {
    const d = new SagaDriver(corpus);
    d.begin({ wave: "ireland", archetype: "economic", tier: 0 }, initMotivators());
    const frame = d.frame();
    expect(frame.actTitle).toContain("Act");
    // Resilient to regeneration: assert the structure, not a specific authored scene id.
    expect(frame.scene).toBeTruthy();
    expect(frame.scene?.prose.length).toBeGreaterThanOrEqual(2);
    expect(d.active).toBe(true);
  });

  it("yields a null scene for an unauthored cell (engine falls back)", () => {
    const d = new SagaDriver(corpus);
    d.begin({ wave: "nonexistent", archetype: "economic", tier: 0 }, initMotivators());
    expect(d.frame().scene).toBeNull();
    expect(d.active).toBe(false);
  });

  it("walks the act scene-by-scene to its end, carrying motivators + flags", () => {
    const d = new SagaDriver(corpus);
    d.begin({ wave: "ireland", archetype: "economic", tier: 0 }, initMotivators());
    // Walk forward making the first available choice each scene until the act ends. Robust to the
    // generated act's exact scene count / beat-vs-decision shape.
    let guard = 0;
    while (d.active && guard < 40) {
      const scene = d.frame().scene;
      if (!scene) break;
      // A decision-bearing scene needs its beat taken first (if any), then the decision resolves it;
      // a plain scene resolves on its beat. Prefer the resolving move so the walk always progresses.
      if (scene.decision) {
        if (scene.beats.length > 0) d.pickBeat(0); // preamble beat (stays on the scene)
        d.pickDecision(0); // resolves → next scene
      } else if (scene.beats.length > 0) {
        d.pickBeat(0); // the beat IS the resolution → next scene
      } else {
        break; // a scene with neither shouldn't occur, but don't spin
      }
      guard += 1;
    }
    expect(d.frame().ended).toBe(true);
    expect(d.active).toBe(false);
    // Some choice along the way shifted at least one motivator off the centrist baseline.
    const m = d.motivators;
    expect(m && Object.values(m).some((v) => v !== 0)).toBe(true);
  });

  it("surfaces a decision option's succession effect to the engine", () => {
    // A synthetic corpus (parsed through the schema) with a close scene that steps the generation.
    const close = SceneSchema.parse({
      id: "sc:test:close",
      sense: "taste",
      prose: ["The old founder's hands fold for the last time, and the ledger passes to you."],
      decision: {
        tier: "major",
        prompt: "Carry the line forward?",
        options: [
          {
            text: "Take a partner and raise heirs.",
            motivatorShift: { lineage: 10 },
            succession: { takesPartner: true, begets: 2 },
          },
          { text: "Let the line end with you." },
        ],
      },
    });
    const act = ActChapterSchema.parse({
      id: "act:test:economic:t0",
      wave: "test",
      archetype: "economic",
      tier: 0,
      macroAct: "convergence",
      title: "Act I — Test",
      scenes: ["sc:test:close"],
    });
    const d = new SagaDriver({
      acts: new Map([[act.id, act]]),
      scenes: new Map([[close.id, close]]),
    });
    d.begin({ wave: "test", archetype: "economic", tier: 0 }, initMotivators());
    const r = d.pickDecision(0);
    expect(r?.succession).toEqual({ takesPartner: true, begets: 2 });
  });
});

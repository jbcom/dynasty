import { describe, expect, it } from "vitest";
import { initMotivators } from "../../motivators";
import {
  actsForTier,
  applyBeatChoice,
  applyDecision,
  buildCorpus,
  crossingLine,
  nextScene,
  openingScene,
  resolveThreads,
  sceneEligible,
} from "../player";
import { ActChapterSchema, SceneSchema } from "../schema";
import { FIXTURE_ACT } from "./fixture";

/**
 * Narrative Acts model — walk the self-contained FIXTURE act as a scene novel (multi-paragraph prose
 * → weave beats that are alternatives → tiered decisions → next scene), applying motivator shifts +
 * flags. Uses a fixture (not the live GenAI corpus) so the model test stays deterministic.
 */

const corpus = buildCorpus(FIXTURE_ACT.acts, FIXTURE_ACT.scenes);

describe("narrative acts (novel model)", () => {
  it("loads the fixture act + scenes through the schema", () => {
    expect(FIXTURE_ACT.acts).toHaveLength(1);
    expect(FIXTURE_ACT.acts[0]?.title).toBe("Act I — The Fixture");
    expect(FIXTURE_ACT.scenes.length).toBeGreaterThanOrEqual(3);
  });

  it("scenes are MULTI-PARAGRAPH novel prose (not fragments)", () => {
    for (const s of FIXTURE_ACT.scenes) {
      expect(s.prose.length, s.id).toBeGreaterThanOrEqual(2); // multi-paragraph
      for (const p of s.prose) expect(p.length).toBeGreaterThan(80); // real prose, not a fragment
    }
  });

  it("walks the act: opening → beat (weave alternative) → next scene", () => {
    const act = actsForTier(corpus, "fix", "economic", 0);
    if (!act) throw new Error("no act");
    const flags = new Set<string>();
    const open = openingScene(corpus, act, flags);
    expect(open?.id).toBe("sc:fix:open");
    if (!open) throw new Error("no opening");

    const m0 = initMotivators();
    const beatOut = applyBeatChoice(open, 0, m0, []);
    expect(beatOut.motivators.wealth).toBeGreaterThan(m0.wealth);
    expect(beatOut.flags).toContain("counts_the_coin");
    expect(beatOut.divertTo).toBeUndefined(); // gather → main flow

    const n1 = nextScene(corpus, act, open, beatOut);
    expect(n1).toBe("sc:fix:rising");
  });

  it("a major decision shifts motivators + sets a flag (+ may carry a succession effect)", () => {
    const close = corpus.scenes.get("sc:fix:close");
    if (!close) throw new Error("no close scene");
    expect(close.decision?.tier).toBe("major");
    const out = applyDecision(close, 0, initMotivators(), []);
    expect(out.flags).toContain("founded_household");
    expect(out.motivators.lineage).toBeGreaterThan(0);
    expect(close.decision?.options[0]?.succession).toEqual({ takesPartner: true, begets: 2 });
  });

  it("scene gating works", () => {
    const s = corpus.scenes.get("sc:fix:open");
    if (!s) throw new Error("no scene");
    expect(sceneEligible(s, new Set())).toBe(true);
  });

  it("WV-1: weaves a crossing ONLY at a curated intersection point (not every act)", () => {
    // A curated point exists for ireland@tier0 with partner italian; build both + a NON-curated wave.
    const mkAct = (wave: string) =>
      ActChapterSchema.parse({
        id: `act:${wave}:economic:t0`,
        wave,
        archetype: "economic",
        tier: 0,
        macroAct: "convergence",
        title: "Act I",
        scenes: [`sc:${wave}:midpoint`],
      });
    const mkMid = (wave: string) =>
      SceneSchema.parse({
        id: `sc:${wave}:midpoint`,
        sense: "sound",
        prose: [
          "The crowd at the dock is a din of a hundred tongues, and one of them is about to matter.",
          "Another family moves through the press, and for a moment the two lines touch.",
        ],
      });
    const c = buildCorpus(
      [mkAct("ireland"), mkAct("italian"), mkAct("scandinavian")],
      [mkMid("ireland"), mkMid("italian"), mkMid("scandinavian")],
    );
    // ireland@0 is curated → gets a woven crossing to italian (its first existing partner).
    const irishMid = c.scenes.get("sc:ireland:midpoint");
    expect(irishMid?.thread).toHaveLength(1);
    expect(irishMid?.thread[0]?.wave).toBe("italian");
    expect(irishMid?.thread[0]?.atTier).toBe(0);
    expect(irishMid?.thread[0]?.relation).toBe("contributing");
    expect(irishMid?.thread[0]?.crossing?.length ?? 0).toBeGreaterThan(0); // bespoke woven prose
    const braided = resolveThreads(c, irishMid!);
    expect(braided[0]?.wave).toBe("italian");
    expect(braided[0]?.crossing.length).toBeGreaterThan(0);
    // scandinavian@0 is NOT a curated point → no auto-sprayed crossing.
    expect(c.scenes.get("sc:scandinavian:midpoint")?.thread).toHaveLength(0);
  });

  it("crossingLine is PAIR-SPECIFIC: it names both peoples (PF-10)", () => {
    const cross = crossingLine("ireland", "italian");
    expect(cross).toContain("Italian"); // the rival wave
    expect(cross).toContain("Irish"); // the player's wave
    // A different pair reads differently.
    expect(crossingLine("ireland", "chinese")).not.toBe(cross);
  });

  it("resolves a cross-family thread (intersection) to the rival wave's act-opening fragment", () => {
    // A second wave's act + a scene in the primary wave that threads to it.
    const rivalAct = ActChapterSchema.parse({
      id: "act:rival:political:t0",
      wave: "rival",
      archetype: "political",
      tier: 0,
      macroAct: "convergence",
      title: "Act I — The Rival",
      scenes: ["sc:rival:open"],
    });
    const rivalScene = SceneSchema.parse({
      id: "sc:rival:open",
      sense: "sight",
      prose: [
        "Across the same grey harbour another line steps ashore, and for one moment your paths cross.",
        "You do not know their name yet, but the century will make you rivals or allies.",
      ],
    });
    const threading = SceneSchema.parse({
      id: "sc:thread:meet",
      sense: "sound",
      prose: [
        "The dock is a din of a hundred tongues, and one of them is about to matter to your line.",
        "A family from another wave moves through the crowd, and the world tilts a degree.",
      ],
      thread: [{ wave: "rival", atTier: 0 }],
    });
    const c = buildCorpus([rivalAct], [rivalScene, threading]);
    const braided = resolveThreads(c, threading);
    expect(braided).toHaveLength(1);
    expect(braided[0]?.wave).toBe("rival");
    expect(braided[0]?.scene.id).toBe("sc:rival:open");
    // A thread to an unauthored wave simply doesn't fire.
    expect(
      resolveThreads(
        c,
        SceneSchema.parse({
          id: "x",
          sense: "smell",
          prose: ["A scene with a thread that points nowhere at all."],
          thread: [{ wave: "ghost", atTier: 0 }],
        }),
      ),
    ).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { initMotivators } from "../../motivators";
import {
  actsForTier,
  applyBeatChoice,
  applyDecision,
  buildCorpus,
  nextScene,
  openingScene,
  sceneEligible,
} from "../player";
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
});

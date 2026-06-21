import { readFileSync } from "node:fs";
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
import { SagaFileSchema } from "../schema";

/**
 * Narrative Acts model — the NOVEL data model: load the authored Ireland/economic act, walk it as
 * a scene novel (multi-paragraph prose → weave beats that gather → tiered decisions → next scene),
 * applying motivator shifts + flags. Proves the model end-to-end on the authored exemplar.
 */

const raw = JSON.parse(readFileSync("src/data/saga/ireland/economic.act.json", "utf8"));
const file = SagaFileSchema.parse(raw);
const corpus = buildCorpus(file.acts, file.scenes);

describe("narrative acts (novel model)", () => {
  it("loads the authored act + scenes through the schema", () => {
    expect(file.acts).toHaveLength(1);
    expect(file.acts[0]?.title).toBe("Act I — The Crossing");
    expect(file.scenes.length).toBeGreaterThanOrEqual(3);
  });

  it("scenes are MULTI-PARAGRAPH novel prose (not fragments)", () => {
    for (const s of file.scenes) {
      expect(s.prose.length, s.id).toBeGreaterThanOrEqual(2); // multi-paragraph
      for (const p of s.prose) expect(p.length).toBeGreaterThan(80); // real prose, not a fragment
    }
  });

  it("the opening does NOT re-confirm when/where (no overhear-the-year)", () => {
    const allProse = file.scenes
      .flatMap((s) => s.prose)
      .join(" ")
      .toLowerCase();
    expect(allProse).not.toContain("overhear the date");
    expect(allProse).not.toContain("the year that fixes when you are");
  });

  it("walks the act: opening → beats (weave) → decision → next scene", () => {
    const act = actsForTier(corpus, "ireland", "economic", 0);
    if (!act) throw new Error("no act");
    const flags = new Set<string>();
    const open = openingScene(corpus, act, flags);
    expect(open?.id).toBe("sc:ire:econ:t0:hold");
    if (!open) throw new Error("no opening");

    // a weave beat that GATHERS: shifts motivators + flag, stays in the scene (no divert).
    const m0 = initMotivators();
    const beatOut = applyBeatChoice(open, 0, m0, []);
    expect(beatOut.motivators.wealth).toBeGreaterThan(m0.wealth);
    expect(beatOut.flags).toContain("counts_the_coin");
    expect(beatOut.divertTo).toBeUndefined(); // gather → main flow

    // fall through to the next scene.
    const n1 = nextScene(corpus, act, open, beatOut);
    expect(n1).toBe("sc:ire:econ:t0:steerage");
  });

  it("a major decision shifts motivators + sets a flag", () => {
    const landing = corpus.scenes.get("sc:ire:econ:t0:landing");
    if (!landing) throw new Error("no landing scene");
    expect(landing.decision?.tier).toBe("major");
    const out = applyDecision(landing, 0, initMotivators(), []);
    expect(out.flags).toContain("chose_the_ledger");
    expect(out.motivators.wealth).toBeGreaterThan(0);
  });

  it("scene gating works", () => {
    const s = corpus.scenes.get("sc:ire:econ:t0:hold");
    if (!s) throw new Error("no scene");
    expect(sceneEligible(s, new Set())).toBe(true);
  });
});

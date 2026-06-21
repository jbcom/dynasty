import { describe, expect, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import { initMotivators } from "../../motivators";
import { actsForTier } from "../player";
import { actEnded, chooseBeat, chooseDecision, startAct } from "../runner";

/**
 * The act runner drives a whole act of the novel scene-by-scene. Walk the authored Ireland/economic
 * tier-0 act start→end and assert the walk is deterministic (same choices → bit-identical end state)
 * — the invariant the engine's save/replay depends on.
 *
 * Authored act flow:
 *   hold (no decision; beats are alternatives — pick one → falls forward) → steerage (secondary
 *   decision → next=landing) → landing (major decision → act end).
 */

const corpus = loadSaga();
const act = actsForTier(corpus, "ireland", "economic", 0);
if (!act) throw new Error("no act");

/** Play the whole act with a fixed set of choices; returns the final state. */
function playAct(beatPick: number, steeragePick: number, landingPick: number) {
  let s = startAct(corpus, act!, initMotivators());
  s = chooseBeat(corpus, s, beatPick); // hold → steerage
  s = chooseDecision(corpus, s, steeragePick); // steerage → landing
  s = chooseDecision(corpus, s, landingPick); // landing → end
  return s;
}

describe("act runner", () => {
  it("opens the act on its first scene", () => {
    const s = startAct(corpus, act!, initMotivators());
    expect(s.sceneId).toBe("sc:ire:econ:t0:hold");
    expect(actEnded(s)).toBe(false);
  });

  it("a beat in a no-decision scene applies its nudge and falls forward", () => {
    const s0 = startAct(corpus, act!, initMotivators());
    const s1 = chooseBeat(corpus, s0, 0);
    expect(s1.sceneId).toBe("sc:ire:econ:t0:steerage"); // fell forward
    expect(s1.flags).toContain("counts_the_coin");
    expect(s1.motivators.wealth).toBeGreaterThan(s0.motivators.wealth);
  });

  it("decisions advance scene-to-scene and finally end the act", () => {
    const s = playAct(0, 0, 0);
    expect(actEnded(s)).toBe(true);
    expect(s.flags).toContain("counts_the_coin"); // hold
    expect(s.flags).toContain("did_the_hard_work"); // steerage opt 0
    expect(s.flags).toContain("chose_the_ledger"); // landing opt 0
  });

  it("different beat alternatives set different flags", () => {
    const a = chooseBeat(corpus, startAct(corpus, act!, initMotivators()), 0);
    const b = chooseBeat(corpus, startAct(corpus, act!, initMotivators()), 1);
    expect(a.flags).toContain("counts_the_coin");
    expect(b.flags).toContain("born_wanting");
  });

  it("is deterministic — same choices produce bit-identical end state", () => {
    expect(JSON.stringify(playAct(0, 0, 0))).toBe(JSON.stringify(playAct(0, 0, 0)));
  });
});

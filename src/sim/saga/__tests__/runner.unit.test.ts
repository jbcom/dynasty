import { describe, expect, it } from "vitest";
import { initMotivators } from "../../motivators";
import { actsForTier, buildCorpus } from "../player";
import { actEnded, chooseBeat, chooseDecision, startAct } from "../runner";
import { FIXTURE_ACT } from "./fixture";

/**
 * The act runner drives a whole act of the novel scene-by-scene. Walk the self-contained FIXTURE act
 * start→end and assert the walk is deterministic (same choices → bit-identical end state) — the
 * invariant the engine's save/replay depends on. Uses a fixture, not the live GenAI corpus.
 *
 * Fixture flow: open (no decision; beats are alternatives — pick one → falls forward) → rising
 * (secondary decision → next=close) → close (major decision → act end).
 */

const corpus = buildCorpus(FIXTURE_ACT.acts, FIXTURE_ACT.scenes);
const act = actsForTier(corpus, "fix", "economic", 0);
if (!act) throw new Error("no act");

/** Play the whole act with a fixed set of choices; returns the final state. */
function playAct(beatPick: number, risingPick: number, closePick: number) {
  let s = startAct(corpus, act!, initMotivators());
  s = chooseBeat(corpus, s, beatPick); // open → rising
  s = chooseDecision(corpus, s, risingPick); // rising → close
  s = chooseDecision(corpus, s, closePick); // close → end
  return s;
}

describe("act runner", () => {
  it("opens the act on its first scene", () => {
    const s = startAct(corpus, act!, initMotivators());
    expect(s.sceneId).toBe("sc:fix:open");
    expect(actEnded(s)).toBe(false);
  });

  it("a beat in a no-decision scene applies its nudge and falls forward", () => {
    const s0 = startAct(corpus, act!, initMotivators());
    const s1 = chooseBeat(corpus, s0, 0);
    expect(s1.sceneId).toBe("sc:fix:rising"); // fell forward
    expect(s1.flags).toContain("counts_the_coin");
    expect(s1.motivators.wealth).toBeGreaterThan(s0.motivators.wealth);
  });

  it("decisions advance scene-to-scene and finally end the act", () => {
    const s = playAct(0, 0, 0);
    expect(actEnded(s)).toBe(true);
    expect(s.flags).toContain("counts_the_coin"); // open
    expect(s.flags).toContain("did_the_hard_work"); // rising opt 0
    expect(s.flags).toContain("founded_household"); // close opt 0
  });

  it("different beat alternatives set different flags", () => {
    const a = chooseBeat(corpus, startAct(corpus, act!, initMotivators()), 0);
    const b = chooseBeat(corpus, startAct(corpus, act!, initMotivators()), 1);
    expect(a.flags).toContain("counts_the_coin");
    expect(b.flags).toContain("reads_the_room");
  });

  it("is deterministic — same choices produce bit-identical end state", () => {
    expect(JSON.stringify(playAct(0, 0, 0))).toBe(JSON.stringify(playAct(0, 0, 0)));
  });
});

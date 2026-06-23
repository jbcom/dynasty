import { describe, expect, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import { initMotivators } from "../../motivators";
import { actEnded, chooseBeat, chooseDecision, currentScene, startAct } from "../runner";

/**
 * SPINE-ACT-DEPTH — the founding act (g0) is deepened with decisionless INTERSTITIAL scenes interleaved
 * between the authored DecisionArchitecture beats: a TEXTURE scene (tex_pressroom) after the open and a
 * CONSEQUENCE scene (csq_aftermath) after the allegiance decision. Per [[novel-not-fragments]] these are
 * weave-only (gather beats, fall forward) — they add lived texture + reading time toward the hour+
 * mandate WITHOUT adding more major decisions (the anti-sameness invariant is unaffected). These tests
 * walk the act and assert the deepened chain is reached from EVERY opening (default + each base variant).
 */

const corpus = loadSaga();

function act() {
  const a = corpus.acts.get("spine:g0:founding");
  if (!a) throw new Error("no g0 act");
  return a;
}

/** Walk g0 from a given founding flag set, always taking beat 0 / decision option 0, collecting scene ids
 *  (stripped of the act prefix) until the act ends or a guard trips. */
function walk(flags: string[]): string[] {
  let state = startAct(corpus, act(), initMotivators(), flags);
  const path: string[] = [];
  let guard = 0;
  while (!actEnded(state) && guard++ < 30) {
    const scene = currentScene(corpus, state);
    if (!scene) break;
    path.push(scene.id.replace("spine:g0:founding:", ""));
    state = scene.decision
      ? chooseDecision(corpus, state, 0)
      : chooseBeat(corpus, state, scene.beats.length ? 0 : 0);
    // A decisionless scene with no beats would not advance via chooseBeat — guard covers that, but the
    // authored interstitials always carry beats, and decision scenes advance via chooseDecision.
  }
  return path;
}

describe("SPINE-ACT-DEPTH: g0 founding act is deepened with texture + consequence interstitials", () => {
  it("a default (press) founder walks open → texture → allegiance → consequence → bargain → close", () => {
    expect(walk([])).toEqual([
      "open",
      "tex_pressroom",
      "allegiance",
      "csq_aftermath",
      "bargain",
      "close",
    ]);
  });

  it("EVERY base founder reaches both interstitials (the texture is on every path, not just the default)", () => {
    for (const base of ["land", "commerce", "pulpit", "law", "military"]) {
      const path = walk([`base:${base}`]);
      expect(path[0], base).toBe(`open_${base}`);
      expect(path, base).toContain("tex_pressroom");
      expect(path, base).toContain("csq_aftermath");
      expect(path[path.length - 1], base).toBe("close");
    }
  });

  it("the interstitials are decisionless TEXTURE — weave beats only, no terminal decision, fall forward", () => {
    for (const id of ["spine:g0:founding:tex_pressroom", "spine:g0:founding:csq_aftermath"]) {
      const s = corpus.scenes.get(id);
      expect(s, id).toBeTruthy();
      expect(s?.decision, `${id} must carry no major decision`).toBeUndefined();
      expect(s?.beats.length, `${id} carries weave beats`).toBeGreaterThanOrEqual(1);
      expect(s?.next, `${id} falls forward via next`).toBeTruthy();
      // Real multi-paragraph prose in the spine voice, with the family-name token.
      expect(s?.prose.length).toBeGreaterThanOrEqual(2);
      expect(s?.prose.join(" ")).toMatch(/\{given_name\}|\{surname\}|\{family_name\}/);
    }
  });

  it("g0 now has at least 6 reachable scenes between open and close (toward the hour+ depth mandate)", () => {
    // The default walk visits 6 distinct scenes; the deepening roughly doubled the act's reading + beats.
    expect(new Set(walk([])).size).toBeGreaterThanOrEqual(6);
  });
});

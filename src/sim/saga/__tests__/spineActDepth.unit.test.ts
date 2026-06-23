import { describe, expect, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import { initMotivators } from "../../motivators";
import { actEnded, chooseBeat, chooseDecision, currentScene, startAct } from "../runner";

/**
 * SPINE-ACT-DEPTH — EVERY spine act (g0..g9) is deepened with decisionless INTERSTITIAL scenes interleaved
 * between the authored DecisionArchitecture beats: a TEXTURE scene after the open and a CONSEQUENCE scene
 * after the first major decision. Per [[novel-not-fragments]] these are weave-only (gather beats, fall
 * forward) — they add lived texture + reading time toward the hour+ mandate WITHOUT adding more major
 * decisions (the anti-sameness invariant is unaffected). These tests walk each act and assert the deepened
 * chain (open → texture → decision → consequence → … → close) is reached from EVERY opening, and that the
 * interstitials are genuine decisionless texture in the spine voice.
 */

const corpus = loadSaga();

/** Every authored spine generation act — all are deepened with a texture + consequence interstitial. */
const SPINE_ACTS = [
  "spine:g0:founding",
  "spine:g1:earlyrepublic",
  "spine:g2:antebellum",
  "spine:g3:gildedage",
  "spine:g4:progressive",
  "spine:g5:midcentury",
  "spine:g6:broadcast",
  "spine:g7:networked",
  "spine:g8:orbital",
  "spine:g9:interstellar",
];

function act(actId: string) {
  const a = corpus.acts.get(actId);
  if (!a) throw new Error(`no act ${actId}`);
  return a;
}

/** Walk an act from a founding flag set, always taking beat 0 / decision option 0, collecting scene ids
 *  (stripped of the act prefix) until the act ends or a guard trips. */
function walk(actId: string, flags: string[]): string[] {
  let state = startAct(corpus, act(actId), initMotivators(), flags);
  const path: string[] = [];
  let guard = 0;
  while (!actEnded(state) && guard++ < 30) {
    const scene = currentScene(corpus, state);
    if (!scene) break;
    path.push(scene.id.replace(`${actId}:`, ""));
    state = scene.decision ? chooseDecision(corpus, state, 0) : chooseBeat(corpus, state, 0);
  }
  return path;
}

describe("SPINE-ACT-DEPTH: every spine act is deepened with texture + consequence interstitials", () => {
  it("g0 walks open → texture → allegiance → consequence → reversal → bargain → close (heavy-act shape)", () => {
    expect(walk("spine:g0:founding", [])).toEqual([
      "open",
      "tex_pressroom",
      "allegiance",
      "csq_aftermath",
      "rev_csq_aftermath",
      "bargain",
      "close",
    ]);
  });

  it("SPINE-ACT-DEPTH-2: the four heaviest-arc acts carry a third REVERSAL interstitial (7 scenes)", () => {
    const heavy = [
      "spine:g0:founding",
      "spine:g3:gildedage",
      "spine:g8:orbital",
      "spine:g9:interstellar",
    ];
    for (const actId of heavy) {
      const path = walk(actId, []);
      expect(
        path.some((id) => id.startsWith("rev_")),
        `${actId} has a reversal scene`,
      ).toBe(true);
      expect(new Set(path).size, `${actId} reaches ≥7 scenes`).toBeGreaterThanOrEqual(7);
      // The reversal sits AFTER the consequence and BEFORE the act's terminal close.
      const revIdx = path.findIndex((id) => id.startsWith("rev_"));
      const csqIdx = path.findIndex((id) => id.startsWith("csq_"));
      expect(revIdx, `${actId} reversal follows the consequence`).toBeGreaterThan(csqIdx);
      expect(revIdx, `${actId} reversal precedes close`).toBeLessThan(path.length - 1);
    }
    // Light acts stay at the ~6-scene shape (no reversal).
    for (const actId of ["spine:g1:earlyrepublic", "spine:g5:midcentury"]) {
      expect(
        walk(actId, []).some((id) => id.startsWith("rev_")),
        actId,
      ).toBe(false);
    }
  });

  for (const actId of SPINE_ACTS) {
    it(`${actId}: a default founder passes BOTH interstitials and ends at close`, () => {
      const path = walk(actId, []);
      expect(
        path.some((id) => id.startsWith("tex_")),
        `${actId} has a texture scene`,
      ).toBe(true);
      expect(
        path.some((id) => id.startsWith("csq_")),
        `${actId} has a consequence scene`,
      ).toBe(true);
      expect(path[path.length - 1], `${actId} ends at close`).toBe("close");
      // The deepening roughly doubled each act: at least 6 distinct reachable scenes (toward the hour+).
      expect(new Set(path).size, `${actId} reaches ≥6 scenes`).toBeGreaterThanOrEqual(6);
    });
  }

  it("g0's five base founders each reach both interstitials (texture is on every path, not just default)", () => {
    for (const base of ["land", "commerce", "pulpit", "law", "military"]) {
      const path = walk("spine:g0:founding", [`base:${base}`]);
      expect(path[0], base).toBe(`open_${base}`);
      expect(path, base).toContain("tex_pressroom");
      expect(path, base).toContain("csq_aftermath");
      expect(path[path.length - 1], base).toBe("close");
    }
  });

  it("every interstitial is decisionless TEXTURE — weave beats only, no terminal decision, falls forward", () => {
    for (const actId of SPINE_ACTS) {
      const a = act(actId);
      const interstitials = a.scenes.filter((id) => /:(tex|csq|rev)_/.test(id));
      expect(interstitials.length, `${actId} has ≥2 interstitials`).toBeGreaterThanOrEqual(2);
      for (const id of interstitials) {
        const s = corpus.scenes.get(id);
        expect(s, id).toBeTruthy();
        expect(s?.decision, `${id} carries no major decision`).toBeUndefined();
        expect(s?.beats.length, `${id} carries weave beats`).toBeGreaterThanOrEqual(1);
        expect(s?.next, `${id} falls forward via next`).toBeTruthy();
        expect(s?.prose.length, `${id} is multi-paragraph`).toBeGreaterThanOrEqual(2);
        expect(s?.prose.join(" "), `${id} uses a family token`).toMatch(
          /\{given_name\}|\{surname\}|\{family_name\}/,
        );
      }
    }
  });
});

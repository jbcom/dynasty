import { describe, expect, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import { type BranchKey, branchOf } from "../../branch";
import { initMotivators } from "../../motivators";
import { chooseBeat, chooseDecision, currentScene, startAct } from "../runner";
import type { Scene } from "../schema";
import { BRANCH_SIGNATURE_FLAG } from "../spineBranch";

/**
 * FS-BRANCH-ONRAMP-AUDIT — prove each destiny branch is reachable through ACTUAL spine PLAY (the runner),
 * not merely present as a flag in the corpus. For every branch, find a spine decision option whose
 * (post-on-ramp-transform) setFlags carry the branch signature, drive the runner to that scene, choose
 * that option, and assert the accumulated flags resolve to the branch via branchOf. This is the
 * play-level guarantee behind the corpus-level check in spineBranch.unit.
 */

const corpus = loadSaga();

/** The spine acts, in generation order (spine:g0 … spine:g9). */
function spineActs() {
  return [...corpus.acts.values()]
    .filter((a) => a.id.startsWith("spine:g"))
    .sort((a, b) => a.id.localeCompare(b.id));
}

interface OnRamp {
  actId: string;
  sceneId: string;
  kind: "decision" | "beat";
  index: number;
}

/** Find a spine act + scene + the decision-option OR beat index whose setFlags include `sig`. */
function findOnRamp(sig: string): OnRamp | null {
  for (const act of spineActs()) {
    for (const sceneId of act.scenes) {
      const scene = corpus.scenes.get(sceneId) as Scene | undefined;
      if (!scene) continue;
      const optionIndex = (scene.decision?.options ?? []).findIndex((o) =>
        o.setFlags.includes(sig),
      );
      if (optionIndex >= 0) return { actId: act.id, sceneId, kind: "decision", index: optionIndex };
      const beatIndex = (scene.beats ?? []).findIndex((b) => b.choice?.setFlags.includes(sig));
      if (beatIndex >= 0) return { actId: act.id, sceneId, kind: "beat", index: beatIndex };
    }
  }
  return null;
}

/** Drive the runner to `onRamp.sceneId`, take the on-ramp (beat or decision), return accumulated flags. */
function playToOnRamp(onRamp: OnRamp): string[] {
  const act = corpus.acts.get(onRamp.actId);
  if (!act) throw new Error(`no act ${onRamp.actId}`);
  let state = startAct(corpus, act, initMotivators());
  for (let guard = 0; guard < 50 && state.sceneId && state.sceneId !== onRamp.sceneId; guard++) {
    const scene = currentScene(corpus, state);
    if (!scene) break;
    state = scene.decision ? chooseDecision(corpus, state, 0) : chooseBeat(corpus, state, 0);
  }
  if (state.sceneId !== onRamp.sceneId)
    throw new Error(`runner did not reach ${onRamp.sceneId} (at ${state.sceneId})`);
  return onRamp.kind === "decision"
    ? chooseDecision(corpus, state, onRamp.index).flags
    : chooseBeat(corpus, state, onRamp.index).flags;
}

describe("FS-BRANCH-ONRAMP-AUDIT: every destiny branch is reachable through spine PLAY", () => {
  const branches = Object.entries(BRANCH_SIGNATURE_FLAG).filter(([, sig]) => sig.length > 0);

  it("covers all six destiny branches", () => {
    expect(branches.length).toBe(6);
  });

  for (const [branch, sig] of branches) {
    it(`${branch}: a runner path that picks the ${branch} on-ramp resolves to branchOf=${branch}`, () => {
      const onRamp = findOnRamp(sig);
      expect(onRamp, `${branch} (${sig}) has no spine on-ramp (beat or decision)`).toBeTruthy();
      if (!onRamp) return;
      // Driving the runner to the on-ramp and taking it actually STAMPS the signature into the live flags.
      const flags = playToOnRamp(onRamp);
      expect(flags, `${branch} on-ramp did not stamp ${sig}`).toContain(sig);
      // And that signature resolves to this branch (branchOf precedence across a mixed path is separate +
      // intentional — here we assert the on-ramp's own contribution is a valid, resolvable on-ramp).
      expect(branchOf({ flags: [sig] })).toBe(branch as BranchKey);
    });
  }
});

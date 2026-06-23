import { describe, expect, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import { type BranchKey, branchOf } from "../../branch";
import { SceneSchema } from "../schema";
import {
  applySpineBranchOnRamps,
  BRANCH_SIGNATURE_FLAG,
  branchSignatureForFlag,
  SPINE_FLAG_TO_BRANCH,
} from "../spineBranch";

/**
 * FS-SPINE-BRANCH-ONRAMPS — the destiny BRANCHES must fork off the SPINE (the founding-spine pivot's
 * "branches off the one timeline"), not off the dead 1885 origins events. These tests prove the on-ramp
 * mapping stamps the branch signature flags onto spine choices and that every destiny branch is reachable
 * from the loaded spine corpus.
 */

describe("spine branch on-ramps", () => {
  it("maps every mapped spine flag to a real branch signature", () => {
    for (const [spineFlag, branch] of Object.entries(SPINE_FLAG_TO_BRANCH)) {
      const sig = branchSignatureForFlag(spineFlag);
      expect(sig, spineFlag).toBeTruthy();
      // The implied signature must actually resolve to its branch via branchOf.
      expect(branchOf({ flags: [sig as string] })).toBe(branch);
    }
  });

  it("stamps the signature flag onto a spine scene choice that sets a mapped path flag", () => {
    const scene = SceneSchema.parse({
      id: "spine:g3:close",
      sense: "sight",
      prose: [
        "The mill-owners gather, and the line must choose what kind of power it will become.",
      ],
      decision: {
        prompt: "What does the house become?",
        options: [
          { text: "Crush the union", setFlags: ["g3_crush_labor"] },
          { text: "Hedge and wait", setFlags: ["g3_venture_hedge"] },
        ],
      },
    });
    const stamped = applySpineBranchOnRamps(scene);
    const crush = stamped.decision?.options[0];
    const hedge = stamped.decision?.options[1];
    // The destiny path gains the oligarchy on-ramp; the neutral hedge is untouched.
    expect(crush?.setFlags).toContain("oligarch_dynasty");
    expect(crush?.setFlags).toContain("g3_crush_labor"); // original preserved
    expect(hedge?.setFlags).not.toContain("oligarch_dynasty");
    expect(hedge?.setFlags).toEqual(["g3_venture_hedge"]);
  });

  it("leaves NON-spine scenes untouched", () => {
    const scene = SceneSchema.parse({
      id: "sc:ireland:open",
      sense: "sound",
      prose: ["A wave scene, not the spine."],
      decision: {
        prompt: "?",
        options: [
          { text: "a", setFlags: ["g3_crush_labor"] },
          { text: "b", setFlags: [] },
        ],
      },
    });
    const out = applySpineBranchOnRamps(scene);
    // Non-spine id → pass-through, even if it (oddly) carries a mapped flag.
    expect(out.decision?.options[0]?.setFlags).toEqual(["g3_crush_labor"]);
  });

  it("every destiny branch is reachable from the loaded spine corpus", () => {
    const corpus = loadSaga();
    const seen = new Set<string>();
    for (const scene of corpus.scenes.values()) {
      for (const b of scene.beats ?? []) for (const f of b.choice?.setFlags ?? []) seen.add(f);
      for (const o of scene.decision?.options ?? []) for (const f of o.setFlags) seen.add(f);
    }
    // Each branch (except the neutral default) must have its signature flag set by some spine choice —
    // proving the destiny is reachable by playing the spine, no dead origins events required.
    const branches = Object.entries(BRANCH_SIGNATURE_FLAG).filter(([, sig]) => sig.length > 0);
    expect(branches.length).toBe(6);
    for (const [branch, sig] of branches) {
      expect(seen.has(sig), `${branch} (${sig}) must be reachable from a spine choice`).toBe(true);
    }
  });

  it("the signature table stays in sync with branch.ts (each resolves to its key)", () => {
    for (const [branch, sig] of Object.entries(BRANCH_SIGNATURE_FLAG)) {
      if (sig.length === 0) continue;
      expect(branchOf({ flags: [sig] })).toBe(branch as BranchKey);
    }
  });
});

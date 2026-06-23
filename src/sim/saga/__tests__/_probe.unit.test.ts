import { describe, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import { BRANCH_SIGNATURE_FLAG } from "../spineBranch";

describe("_probe", () => {
  it("dumps on-ramp positions", () => {
    const corpus = loadSaga();
    const spineActs = [...corpus.acts.values()]
      .filter((a) => a.id.startsWith("spine:g"))
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const [branch, sig] of Object.entries(BRANCH_SIGNATURE_FLAG)) {
      if (!sig) continue;
      let found: unknown = null;
      for (const act of spineActs) {
        for (const sceneId of act.scenes) {
          const sc = corpus.scenes.get(sceneId);
          if (!sc) continue;
          const oi = (sc.decision?.options ?? []).findIndex((o) => o.setFlags.includes(sig));
          if (oi >= 0) {
            found = { act: act.id, scene: sceneId, kind: "dec", i: oi, pos: act.scenes.indexOf(sceneId) };
            break;
          }
          const bi = (sc.beats ?? []).findIndex((b) => b.choice?.setFlags.includes(sig));
          if (bi >= 0) {
            found = { act: act.id, scene: sceneId, kind: "beat", i: bi, pos: act.scenes.indexOf(sceneId) };
            break;
          }
        }
        if (found) break;
      }
      // biome-ignore lint/suspicious/noConsole: probe
      console.log(branch, sig, "->", JSON.stringify(found));
    }
  });
});
